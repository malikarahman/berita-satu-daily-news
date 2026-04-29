import { PrismaClient } from "@prisma/client";
import { DEFAULT_EDITORS } from "../src/data/editors";
import { fetchNormalizedWeather } from "../src/lib/bmkg/fetcher";
import { fallbackWeather } from "../src/lib/bmkg/fallback";
import { generateArticle } from "../src/lib/articles/generator";

const prisma = new PrismaClient();
const seedDate = new Date("2026-04-27T00:00:00+07:00");
const seedDateKey = "2026-04-27";

const seedDefinitions = [
  { location: "Jakarta", runType: "Automated Manual", status: "Pending Review", editorName: "Editor Piket", template: "Auto" as const },
  { location: "Tangerang", runType: "Automated Manual", status: "Approved", editorName: "Editor Piket", template: "Template 11" as const },
  { location: "Depok", runType: "Manual", status: "Revision Needed", editorName: "Editor Piket", template: "Template 3" as const },
  { location: "Bekasi", runType: "Manual", status: "Pending Review", editorName: "Editor Piket", template: "Template 8" as const },
  { location: "Bogor", runType: "Automated Manual", status: "Approved", editorName: "Editor Piket", template: "Template 7" as const }
];

async function weatherForSeed(location: string) {
  try {
    return await fetchNormalizedWeather(location, seedDate);
  } catch (error) {
    return fallbackWeather(
      location,
      seedDate,
      `Sample seed data dipakai karena BMKG belum tersedia saat seeding: ${error instanceof Error ? error.message : "unknown error"}`
    );
  }
}

async function main() {
  await prisma.errorLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: DEFAULT_EDITORS.map((name, index) => ({
      name,
      role: index === 1 ? "Lead Editor" : "Editor",
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@beritasatu.internal`
    }))
  });

  for (const [index, definition] of seedDefinitions.entries()) {
    const weather = await weatherForSeed(definition.location);
    const generated = generateArticle(weather, definition.template);
    const requestedPublishDatetime =
      definition.runType === "Scheduled"
        ? new Date(`${seedDateKey}T00:00:00+07:00`)
        : new Date(`${seedDateKey}T00:00:00+07:00`);
    const generationTime =
      definition.runType === "Scheduled" || definition.runType === "Automated Manual"
        ? new Date(`${seedDateKey}T05:0${index}:00+07:00`)
        : new Date(`${seedDateKey}T13:1${index}:00+07:00`);
    const baseNote =
      weather.source_mode === "fallback_sample"
        ? "Sample seed data berbasis struktur BMKG untuk preview dashboard."
        : "Seed record dibuat dari pipeline BMKG live untuk preview dashboard.";
    const article = await prisma.article.create({
      data: {
        sourceName: "BMKG",
        sourceUrl: weather.source_url,
        dataSource: "BMKG",
        category: "Cuaca",
        location: weather.publication_location,
        date: new Date(`${weather.date}T00:00:00+07:00`),
        dayName: weather.day_name,
        title: generated.title,
        previewText: generated.previewText,
        bodyText: generated.bodyText,
        weatherPayloadJson: JSON.stringify({ ...weather, selected_template: generated.templateUsed }, null, 2),
        draftUrl: null,
        templatePreference: definition.template,
        selectedTemplate: generated.templateUsed,
        editorialNotes: baseNote,
        dataCompletenessNote: weather.data_completeness.notes,
        runType: definition.runType,
        triggeredBy: definition.runType === "Manual" ? definition.editorName : "Editor Piket",
        generationTime,
        requestedPublishDatetime,
        status: definition.status,
        editorName: definition.editorName,
        notes:
          definition.status === "Revision Needed"
            ? "Perlu rapikan lead dan cek ulang pemilihan template."
            : definition.status === "Approved"
              ? "Sudah lolos review editor."
              : "Menunggu review editor.",
        activityLogs: {
          create: [
            {
              action:
                definition.runType === "Automated Manual"
                  ? "Automated Batch Article Generated"
                  : definition.runType === "Scheduled"
                    ? "Scheduled Article Generated"
                    : "Article Generated",
              previousStatus: null,
              newStatus: "Pending Review",
              actorName: definition.runType === "Manual" ? definition.editorName : "Editor Piket",
              note: "Draft artikel berhasil dibuat."
            },
            {
              action: "Editorial Note Added",
              previousStatus: null,
              newStatus: null,
              actorName: "System",
              note: baseNote
            },
            {
              action: "Editor Assigned",
              previousStatus: null,
              newStatus: null,
              actorName: "System",
              note: `Editor assigned to ${definition.editorName}`
            },
            ...(definition.status !== "Pending Review"
              ? [
                  {
                    action: "Status Changed",
                    previousStatus: "Pending Review",
                    newStatus: definition.status,
                    actorName: definition.editorName,
                    note:
                      definition.status === "Approved"
                        ? "Artikel disetujui setelah review awal."
                        : "Perlu revisi kecil pada struktur paragraf."
                  }
                ]
              : [])
          ]
        }
      }
    });

    if (weather.source_mode === "fallback_sample") {
      await prisma.errorLog.create({
        data: {
          errorType: "seed_fallback_notice",
          module: "seed",
          action: "seed_weather_fallback",
          message: "BMKG live tidak tersedia saat seed, sample data dipakai.",
          technicalDetails: weather.data_completeness.notes,
          articleId: article.id,
          location: definition.location,
          sourceUrl: weather.source_url,
          actor: "System",
          result: "fallback_sample"
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.info("Seed data created.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

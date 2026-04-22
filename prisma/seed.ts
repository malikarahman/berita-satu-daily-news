import { PrismaClient } from "@prisma/client";
import { generateArticle } from "../src/lib/articles/generator";
import { fallbackWeather } from "../src/lib/bmkg/fallback";

const prisma = new PrismaClient();

const seedDate = new Date("2026-04-22T00:00:00");

const samples = [
  { location: "Jakarta", status: "Pending Review", runType: "Scheduled", editorName: "Editor Piket", template: "Template 2" as const },
  { location: "Tangerang Selatan", status: "Approved", runType: "Scheduled", editorName: "Dina Pramesti", template: "Template 1" as const },
  { location: "Depok", status: "Revision Needed", runType: "Manual", editorName: "Raka Mahendra", template: "Template 3" as const },
  { location: "Bekasi", status: "Pending Review", runType: "Manual", editorName: "Maya Sari", template: "Auto" as const },
  { location: "Bogor", status: "Approved", runType: "Scheduled", editorName: "Editor Piket", template: "Template 3" as const }
];

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.article.deleteMany();
  await prisma.systemLog.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      { name: "Editor Piket", role: "Editor", email: "editor.piket@beritasatu.internal" },
      { name: "Dina Pramesti", role: "Lead Editor", email: "dina.pramesti@beritasatu.internal" },
      { name: "Raka Mahendra", role: "Editor", email: "raka.mahendra@beritasatu.internal" },
      { name: "Maya Sari", role: "Editor", email: "maya.sari@beritasatu.internal" }
    ]
  });

  for (const [index, sample] of samples.entries()) {
    const weather = fallbackWeather(sample.location, seedDate, "Seed data for local preview.");
    const generated = generateArticle(weather, sample.template);
    const generatedAt = new Date(`2026-04-22T0${Math.min(index + 5, 9)}:0${index}:00`);
    const requestedPublishDatetime =
      sample.runType === "Scheduled"
        ? new Date("2026-04-22T07:00:00")
        : new Date(`2026-04-22T1${index + 1}:00:00`);

    await prisma.article.create({
      data: {
        sourceName: "BMKG",
        sourceUrl: "https://cuaca.bmkg.go.id/",
        category: "Cuaca",
        location: sample.location,
        date: seedDate,
        dayName: "Rabu",
        title: generated.title,
        previewText: generated.previewText,
        bodyText: generated.bodyText,
        weatherPayloadJson: JSON.stringify({ ...weather, template_used: generated.templateUsed }, null, 2),
        draftUrl: null,
        runType: sample.runType,
        triggeredBy: sample.runType === "Scheduled" ? "System" : sample.editorName,
        generationTime: generatedAt,
        requestedPublishDatetime,
        status: sample.status,
        editorName: sample.editorName,
        notes:
          sample.status === "Revision Needed"
            ? "Perlu periksa ulang frasa intensitas hujan sebelum approval."
            : sample.status === "Approved"
              ? "Sudah dicek redaksi."
              : "Menunggu review editor.",
        activityLogs: {
          create: [
            {
              action: `${sample.runType} article generated`,
              previousStatus: null,
              newStatus: "Pending Review",
              actorName: sample.runType === "Scheduled" ? "System" : sample.editorName,
              note: "Seed data generated for dashboard preview."
            },
            ...(sample.status !== "Pending Review"
              ? [
                  {
                    action: "Status updated",
                    previousStatus: "Pending Review",
                    newStatus: sample.status,
                    actorName: sample.editorName,
                    note: sample.status === "Approved" ? "Approved after editorial check." : "Needs headline and paragraph review."
                  }
                ]
              : [])
          ]
        }
      }
    });
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

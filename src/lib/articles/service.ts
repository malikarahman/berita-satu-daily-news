import { z } from "zod";
import { combineDateTime, toIsoDate } from "@/lib/articles/date";
import { generateArticle } from "@/lib/articles/generator";
import { ARTICLE_STATUSES, TEMPLATE_PREFERENCES, type ArticleStatus, type RunArticleInput } from "@/lib/articles/types";
import { fetchNormalizedWeather } from "@/lib/bmkg/fetcher";
import { scheduledLocationsFromEnv } from "@/lib/bmkg/locations";
import { prisma } from "@/lib/db/prisma";

const runArticleSchema = z.object({
  category: z.string().min(1).default("Cuaca"),
  location: z.string().min(1),
  dataSource: z.literal("BMKG").default("BMKG"),
  intendedPublishDate: z.string().min(10),
  intendedPublishTime: z.string().min(4),
  templatePreference: z.enum(TEMPLATE_PREFERENCES).default("Auto"),
  assignedEditor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  triggeredBy: z.string().optional().default(process.env.DEFAULT_EDITOR_NAME ?? "Editor Piket")
});

export async function listArticles(searchParams: URLSearchParams) {
  const search = searchParams.get("search")?.trim();
  const date = searchParams.get("date")?.trim();
  const where = {
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { location: { contains: search } }
          ]
        }
      : {}),
    ...(date ? { date: { gte: new Date(`${date}T00:00:00`), lt: new Date(`${date}T23:59:59`) } } : {}),
    ...(searchParams.get("location") ? { location: searchParams.get("location")! } : {}),
    ...(searchParams.get("category") ? { category: searchParams.get("category")! } : {}),
    ...(searchParams.get("status") ? { status: searchParams.get("status")! } : {}),
    ...(searchParams.get("runType") ? { runType: searchParams.get("runType")! } : {}),
    ...(searchParams.get("editor") ? { editorName: searchParams.get("editor")! } : {})
  };

  const [articles, todayArticles, pendingReview, approved, revisionNeeded, rejected] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ generationTime: "desc" }, { id: "desc" }],
      include: { activityLogs: { orderBy: { createdAt: "desc" } } }
    }),
    prisma.article.count({
      where: {
        createdAt: {
          gte: new Date(`${toIsoDate(new Date())}T00:00:00`),
          lt: new Date(`${toIsoDate(new Date())}T23:59:59`)
        }
      }
    }),
    prisma.article.count({ where: { status: "Pending Review" } }),
    prisma.article.count({ where: { status: "Approved" } }),
    prisma.article.count({ where: { status: "Revision Needed" } }),
    prisma.article.count({ where: { status: "Rejected" } })
  ]);

  return {
    articles,
    summary: {
      totalToday: todayArticles,
      pendingReview,
      approved,
      revisionNeeded,
      rejected
    }
  };
}

export async function getArticle(id: number) {
  return prisma.article.findUnique({
    where: { id },
    include: { activityLogs: { orderBy: { createdAt: "desc" } } }
  });
}

export async function runManualArticle(input: RunArticleInput) {
  const parsed = runArticleSchema.parse(input);
  const publishAt = combineDateTime(parsed.intendedPublishDate, parsed.intendedPublishTime);
  const weather = await fetchNormalizedWeather(parsed.location, new Date(`${parsed.intendedPublishDate}T00:00:00`));
  const generated = generateArticle(weather, parsed.templatePreference);

  return prisma.article.create({
    data: {
      sourceName: "BMKG",
      sourceUrl: weather.source_url,
      category: parsed.category,
      location: weather.location,
      date: new Date(`${weather.date}T00:00:00`),
      dayName: weather.day_name,
      title: generated.title,
      previewText: generated.previewText,
      bodyText: generated.bodyText,
      weatherPayloadJson: JSON.stringify({ ...weather, template_used: generated.templateUsed }, null, 2),
      runType: "Manual",
      triggeredBy: parsed.triggeredBy,
      generationTime: new Date(),
      requestedPublishDatetime: publishAt,
      status: "Pending Review",
      editorName: parsed.assignedEditor || null,
      notes: parsed.notes || null,
      activityLogs: {
        create: {
          action: "Manual article generated",
          previousStatus: null,
          newStatus: "Pending Review",
          actorName: parsed.triggeredBy,
          note: weather.source_mode === "fallback" ? weather.warnings?.join("; ") : "Generated from BMKG weather data."
        }
      }
    },
    include: { activityLogs: { orderBy: { createdAt: "desc" } } }
  });
}

export async function runScheduledArticles(locations = scheduledLocationsFromEnv(), actorName = "System") {
  const now = new Date();
  const intendedPublishDate = toIsoDate(now);
  const results = [];

  for (const location of locations) {
    const weather = await fetchNormalizedWeather(location, now);
    const generated = generateArticle(weather, "Auto");

    const article = await prisma.article.create({
      data: {
        sourceName: "BMKG",
        sourceUrl: weather.source_url,
        category: "Cuaca",
        location: weather.location,
        date: new Date(`${weather.date}T00:00:00`),
        dayName: weather.day_name,
        title: generated.title,
        previewText: generated.previewText,
        bodyText: generated.bodyText,
        weatherPayloadJson: JSON.stringify({ ...weather, template_used: generated.templateUsed }, null, 2),
        runType: "Scheduled",
        triggeredBy: actorName,
        generationTime: now,
        requestedPublishDatetime: combineDateTime(intendedPublishDate, "07:00"),
        status: "Pending Review",
        activityLogs: {
          create: {
            action: "Scheduled article generated",
            previousStatus: null,
            newStatus: "Pending Review",
            actorName,
            note: weather.source_mode === "fallback" ? weather.warnings?.join("; ") : "Generated from BMKG weather data."
          }
        }
      },
      include: { activityLogs: { orderBy: { createdAt: "desc" } } }
    });

    results.push(article);
  }

  return results;
}

export async function updateArticleWorkflow(
  id: number,
  input: { status?: ArticleStatus; notes?: string | null; editorName?: string | null; actorName?: string }
) {
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) throw new Error("Article not found");

  if (input.status && !ARTICLE_STATUSES.includes(input.status)) {
    throw new Error("Invalid article status");
  }

  const changedStatus = input.status && input.status !== existing.status;
  const changedNotes = input.notes !== undefined && input.notes !== existing.notes;
  const changedEditor = input.editorName !== undefined && input.editorName !== existing.editorName;
  const actorName = input.actorName || process.env.DEFAULT_EDITOR_NAME || "Editor Piket";
  const data = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.editorName !== undefined ? { editorName: input.editorName } : {}),
    ...((changedStatus || changedNotes || changedEditor)
      ? {
          activityLogs: {
            create: {
              action: changedStatus ? "Status updated" : changedEditor ? "Editor assigned" : "Notes updated",
              previousStatus: changedStatus ? existing.status : null,
              newStatus: changedStatus ? input.status : null,
              actorName,
              note: input.notes ?? null
            }
          }
        }
      : {})
  };

  return prisma.article.update({
    where: { id },
    data,
    include: { activityLogs: { orderBy: { createdAt: "desc" } } }
  });
}

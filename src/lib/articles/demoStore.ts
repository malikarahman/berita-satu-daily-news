import { toIsoDate } from "@/lib/articles/date";
import { generateArticle } from "@/lib/articles/generator";
import type { ArticleStatus, RunArticleInput } from "@/lib/articles/types";
import { fetchNormalizedWeather } from "@/lib/bmkg/fetcher";
import { fallbackWeather } from "@/lib/bmkg/fallback";

type DemoActivityLog = {
  id: number;
  articleId: number;
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  actorName: string;
  note: string | null;
  createdAt: Date;
};

type DemoArticle = {
  id: number;
  sourceName: string;
  sourceUrl: string;
  category: string;
  location: string;
  date: Date;
  dayName: string;
  title: string;
  previewText: string;
  bodyText: string;
  weatherPayloadJson: string;
  draftUrl: string | null;
  runType: string;
  triggeredBy: string;
  generationTime: Date;
  requestedPublishDatetime: Date;
  status: ArticleStatus;
  editorName: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  activityLogs: DemoActivityLog[];
};

type DemoState = {
  articles: DemoArticle[];
  nextArticleId: number;
  nextLogId: number;
};

const globalForDemo = globalThis as unknown as {
  beritaSatuDemoStore?: DemoState;
};

const SAMPLE_CONFIG = [
  { location: "Jakarta", status: "Pending Review" as const, runType: "Scheduled", editorName: "Editor Piket", template: "Template 2" as const },
  { location: "Tangerang Selatan", status: "Approved" as const, runType: "Scheduled", editorName: "Dina Pramesti", template: "Template 1" as const },
  { location: "Depok", status: "Revision Needed" as const, runType: "Manual", editorName: "Raka Mahendra", template: "Template 3" as const },
  { location: "Bekasi", status: "Pending Review" as const, runType: "Manual", editorName: "Maya Sari", template: "Auto" as const },
  { location: "Bogor", status: "Approved" as const, runType: "Scheduled", editorName: "Editor Piket", template: "Template 3" as const }
];

function combine(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

function createInitialState(): DemoState {
  const seedDate = new Date("2026-04-22T00:00:00");
  let nextLogId = 1;

  const articles = SAMPLE_CONFIG.map((sample, index) => {
    const weather = fallbackWeather(sample.location, seedDate, "Demo fallback data for hosted preview.");
    const generated = generateArticle(weather, sample.template);
    const id = index + 1;
    const generatedAt = new Date(`2026-04-22T0${Math.min(index + 5, 9)}:0${index}:00`);
    const requestedPublishDatetime =
      sample.runType === "Scheduled"
        ? new Date("2026-04-22T07:00:00")
        : new Date(`2026-04-22T1${index + 1}:00:00`);
    const activityLogs: DemoActivityLog[] = [
      {
        id: nextLogId++,
        articleId: id,
        action: `${sample.runType} article generated`,
        previousStatus: null,
        newStatus: "Pending Review",
        actorName: sample.runType === "Scheduled" ? "System" : sample.editorName,
        note: "Demo fallback data shown because no persistent database is configured.",
        createdAt: generatedAt
      }
    ];

    if (sample.status !== "Pending Review") {
      activityLogs.push({
        id: nextLogId++,
        articleId: id,
        action: "Status updated",
        previousStatus: "Pending Review",
        newStatus: sample.status,
        actorName: sample.editorName,
        note: sample.status === "Approved" ? "Approved after editorial check." : "Needs headline and paragraph review.",
        createdAt: new Date(generatedAt.getTime() + 20 * 60 * 1000)
      });
    }

    return {
      id,
      sourceName: "BMKG",
      sourceUrl: weather.source_url,
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
      createdAt: generatedAt,
      updatedAt: generatedAt,
      activityLogs
    };
  });

  return {
    articles,
    nextArticleId: articles.length + 1,
    nextLogId
  };
}

function state() {
  globalForDemo.beritaSatuDemoStore ??= createInitialState();
  return globalForDemo.beritaSatuDemoStore;
}

function matches(article: DemoArticle, searchParams: URLSearchParams) {
  const search = searchParams.get("search")?.trim().toLowerCase();
  const date = searchParams.get("date")?.trim();
  if (search && !article.title.toLowerCase().includes(search) && !article.location.toLowerCase().includes(search)) return false;
  if (date && toIsoDate(article.date) !== date) return false;
  if (searchParams.get("location") && article.location !== searchParams.get("location")) return false;
  if (searchParams.get("category") && article.category !== searchParams.get("category")) return false;
  if (searchParams.get("status") && article.status !== searchParams.get("status")) return false;
  if (searchParams.get("runType") && article.runType !== searchParams.get("runType")) return false;
  if (searchParams.get("editor") && article.editorName !== searchParams.get("editor")) return false;
  return true;
}

function summary(articles: DemoArticle[]) {
  const today = toIsoDate(new Date());
  return {
    totalToday: articles.filter((article) => toIsoDate(article.createdAt) === today).length,
    pendingReview: articles.filter((article) => article.status === "Pending Review").length,
    approved: articles.filter((article) => article.status === "Approved").length,
    revisionNeeded: articles.filter((article) => article.status === "Revision Needed").length,
    rejected: articles.filter((article) => article.status === "Rejected").length
  };
}

export function listDemoArticles(searchParams: URLSearchParams) {
  const store = state();
  const articles = store.articles
    .filter((article) => matches(article, searchParams))
    .sort((a, b) => b.generationTime.getTime() - a.generationTime.getTime() || b.id - a.id);

  return {
    articles,
    summary: summary(store.articles)
  };
}

export function getDemoArticle(id: number) {
  return state().articles.find((article) => article.id === id) ?? null;
}

export async function createDemoManualArticle(input: RunArticleInput) {
  const store = state();
  const intendedPublishDate = input.intendedPublishDate;
  const intendedPublishTime = input.intendedPublishTime;
  const weather = await fetchNormalizedWeather(input.location, new Date(`${intendedPublishDate}T00:00:00`));
  const generated = generateArticle(weather, input.templatePreference ?? "Auto");
  const now = new Date();
  const articleId = store.nextArticleId++;
  const logId = store.nextLogId++;
  const article: DemoArticle = {
    id: articleId,
    sourceName: "BMKG",
    sourceUrl: weather.source_url,
    category: input.category || "Cuaca",
    location: weather.location,
    date: new Date(`${weather.date}T00:00:00`),
    dayName: weather.day_name,
    title: generated.title,
    previewText: generated.previewText,
    bodyText: generated.bodyText,
    weatherPayloadJson: JSON.stringify({ ...weather, template_used: generated.templateUsed }, null, 2),
    draftUrl: null,
    runType: "Manual",
    triggeredBy: input.triggeredBy || process.env.DEFAULT_EDITOR_NAME || "Editor Piket",
    generationTime: now,
    requestedPublishDatetime: combine(intendedPublishDate, intendedPublishTime),
    status: "Pending Review",
    editorName: input.assignedEditor || null,
    notes: input.notes || "Demo mode: changes are not persisted across deployments.",
    createdAt: now,
    updatedAt: now,
    activityLogs: [
      {
        id: logId,
        articleId,
        action: "Manual article generated",
        previousStatus: null,
        newStatus: "Pending Review",
        actorName: input.triggeredBy || "Editor Piket",
        note: "Saved in demo fallback mode because no persistent database is configured.",
        createdAt: now
      }
    ]
  };

  store.articles.unshift(article);
  return article;
}

export async function createDemoScheduledArticles(locations: string[], actorName = "System") {
  const store = state();
  const now = new Date();
  const publishDate = toIsoDate(now);
  const created = [];

  for (const location of locations) {
    const weather = await fetchNormalizedWeather(location, now);
    const generated = generateArticle(weather, "Auto");
    const articleId = store.nextArticleId++;
    const logId = store.nextLogId++;
    const article: DemoArticle = {
      id: articleId,
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
      draftUrl: null,
      runType: "Scheduled",
      triggeredBy: actorName,
      generationTime: now,
      requestedPublishDatetime: combine(publishDate, "07:00"),
      status: "Pending Review",
      editorName: null,
      notes: "Demo mode: scheduled article stored in memory.",
      createdAt: now,
      updatedAt: now,
      activityLogs: [
        {
          id: logId,
          articleId,
          action: "Scheduled article generated",
          previousStatus: null,
          newStatus: "Pending Review",
          actorName,
          note: "Saved in demo fallback mode because no persistent database is configured.",
          createdAt: now
        }
      ]
    };

    store.articles.unshift(article);
    created.push(article);
  }

  return created;
}

export function updateDemoArticleWorkflow(
  id: number,
  input: { status?: ArticleStatus; notes?: string | null; editorName?: string | null; actorName?: string }
) {
  const store = state();
  const article = store.articles.find((item) => item.id === id);
  if (!article) throw new Error("Article not found");

  const previousStatus = article.status;
  const changedStatus = input.status && input.status !== article.status;
  const changedEditor = input.editorName !== undefined && input.editorName !== article.editorName;
  const changedNotes = input.notes !== undefined && input.notes !== article.notes;

  if (input.status) article.status = input.status;
  if (input.editorName !== undefined) article.editorName = input.editorName;
  if (input.notes !== undefined) article.notes = input.notes;
  article.updatedAt = new Date();

  if (changedStatus || changedEditor || changedNotes) {
    article.activityLogs.unshift({
      id: store.nextLogId++,
      articleId: article.id,
      action: changedStatus ? "Status updated" : changedEditor ? "Editor assigned" : "Notes updated",
      previousStatus: changedStatus ? previousStatus : null,
      newStatus: changedStatus ? article.status : null,
      actorName: input.actorName || "Editor Piket",
      note: input.notes ?? "Demo mode update.",
      createdAt: new Date()
    });
  }

  return article;
}

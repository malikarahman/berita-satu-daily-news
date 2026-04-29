import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { TEMPLATE_OPTIONS } from "@/data/articleTemplates";
import {
  ALL_REGION_OPTION,
  coverageLabelFromSelection,
  findRegionByPublicationArea,
  findRegionGroup,
  regionLabelsFromValues,
  resolvePublicationAreas
} from "@/data/coverageGroups";
import { combineDateTime, toIsoDate } from "@/lib/articles/date";
import { generateArticle } from "@/lib/articles/generator";
import {
  ARTICLE_STATUSES,
  type ArticleStatus,
  type ConcreteTemplate,
  type CoverageType,
  type NormalizedWeather,
  type RunArticleInput,
  type RunType,
  type TemplatePreference
} from "@/lib/articles/types";
import { aggregateNormalizedWeatherSet, fetchNormalizedWeather } from "@/lib/bmkg/fetcher";
import { ensureDatabaseConfiguration, prisma } from "@/lib/db/prisma";
import { logError } from "@/lib/db/systemLog";

const runArticleSchema = z.object({
  category: z.string().min(1).default("Cuaca"),
  location: z.string().optional(),
  dataSource: z.literal("BMKG").default("BMKG"),
  intendedPublishDate: z.string().min(10).optional().default(toIsoDate(new Date())),
  templatePreference: z.enum(TEMPLATE_OPTIONS).default("Auto"),
  assignedEditor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  triggeredBy: z.string().optional().default(process.env.DEFAULT_EDITOR_NAME ?? "Editor Piket"),
  editorInstruction: z.string().optional().nullable(),
  coverageType: z
    .enum(["single_region", "multiple_publication_areas", "multiple_regions", "all_region"])
    .optional(),
  selectedRegionGroups: z.array(z.string()).optional(),
  selectedPublicationAreas: z.array(z.string()).optional(),
  useAllRegion: z.boolean().optional()
});

const workflowSchema = z.object({
  status: z.enum(ARTICLE_STATUSES).optional(),
  notes: z.string().optional().nullable(),
  editorName: z.string().optional().nullable(),
  bodyText: z.string().optional(),
  actorName: z.string().optional()
});

type PersistDraftInput = {
  weather: NormalizedWeather;
  generated: {
    templateUsed: ConcreteTemplate;
    title: string;
    previewText: string;
    bodyText: string;
  };
  category: string;
  dataSource: string;
  runType: RunType;
  triggeredBy: string;
  requestedPublishDatetime: Date;
  templatePreference: TemplatePreference;
  editorName?: string | null;
  notes?: string | null;
  editorialNotes?: string | null;
  activityAction: string;
  activityNote?: string | null;
  metadata?: Record<string, unknown>;
};

type ResolvedCoverage = {
  coverageType: CoverageType;
  regionValues: string[];
  regionLabels: string[];
  publicationAreas: string[];
  publicationLocationLabel: string;
};

function todayRange() {
  const date = toIsoDate(new Date());
  return {
    gte: new Date(`${date}T00:00:00`),
    lt: new Date(`${date}T23:59:59`)
  };
}

function buildRequestedPublishDateOnly(date: string) {
  return combineDateTime(date, "00:00");
}

function combineEditorNotes(notes?: string | null, editorInstruction?: string | null) {
  const items = [notes?.trim(), editorInstruction?.trim()].filter(Boolean) as string[];
  return items.length ? items.join("\n\n") : null;
}

function buildEditorialNotes(weather: NormalizedWeather) {
  const items = [
    weather.source_mode === "fallback_sample"
      ? "Artikel dibuat menggunakan fallback sample data karena BMKG tidak dapat diakses saat proses seed atau pengujian."
      : null,
    weather.data_completeness.notes,
    weather.aggregation_notes?.join(" ")
  ].filter(Boolean) as string[];

  if (!items.length) {
    return `Draft disusun dari data BMKG ${weather.fetched_at} untuk ${weather.publication_location}.`;
  }

  return [...new Set(items)].join(" ");
}

function serializeWeatherPayload(
  weather: NormalizedWeather,
  selectedTemplate: ConcreteTemplate,
  metadata?: Record<string, unknown>
) {
  return JSON.stringify(
    {
      ...weather,
      selected_template: selectedTemplate,
      ...(metadata ? { generation_metadata: metadata } : {})
    },
    null,
    2
  );
}

function articleWhere(searchParams: URLSearchParams): Prisma.ArticleWhereInput {
  const search = searchParams.get("search")?.trim();
  const date = searchParams.get("date")?.trim();

  return {
    ...(search
      ? {
          OR: [{ title: { contains: search } }, { location: { contains: search } }]
        }
      : {}),
    ...(date
      ? {
          date: {
            gte: new Date(`${date}T00:00:00`),
            lt: new Date(`${date}T23:59:59`)
          }
        }
      : {}),
    ...(searchParams.get("location") ? { location: searchParams.get("location")! } : {}),
    ...(searchParams.get("status") ? { status: searchParams.get("status")! } : {}),
    ...(searchParams.get("runType") ? { runType: searchParams.get("runType")! } : {}),
    ...(searchParams.get("editor") ? { editorName: searchParams.get("editor")! } : {})
  };
}

function actionModule(action: string) {
  const normalized = action.toLowerCase();
  if (normalized.includes("bmkg")) return "bmkg";
  if (normalized.includes("template")) return "template";
  if (normalized.includes("batch") || normalized.includes("automated")) return "batch";
  if (normalized.includes("article generated") || normalized.includes("article body")) return "generation";
  return "editorial";
}

async function persistDraft(input: PersistDraftInput) {
  return prisma.article.create({
    data: {
      sourceName: "BMKG",
      sourceUrl: input.weather.source_url,
      dataSource: input.dataSource,
      category: input.category,
      location: input.weather.publication_location,
      date: new Date(`${input.weather.date}T00:00:00`),
      dayName: input.weather.day_name,
      title: input.generated.title,
      previewText: input.generated.previewText,
      bodyText: input.generated.bodyText,
      weatherPayloadJson: serializeWeatherPayload(
        input.weather,
        input.generated.templateUsed,
        input.metadata
      ),
      templatePreference: input.templatePreference,
      selectedTemplate: input.generated.templateUsed,
      editorialNotes: input.editorialNotes ?? null,
      dataCompletenessNote: input.weather.data_completeness.notes,
      runType: input.runType,
      triggeredBy: input.triggeredBy,
      generationTime: new Date(),
      requestedPublishDatetime: input.requestedPublishDatetime,
      status: "Pending Review",
      editorName: input.editorName ?? null,
      notes: input.notes ?? null,
      activityLogs: {
        create: [
          {
            action: input.activityAction,
            previousStatus: null,
            newStatus: "Pending Review",
            actorName: input.triggeredBy,
            note: input.activityNote ?? "Draft artikel berhasil dibuat."
          },
          {
            action: "BMKG Data Fetched",
            previousStatus: null,
            newStatus: null,
            actorName: input.triggeredBy,
            note: `Data BMKG berhasil diringkas untuk ${input.weather.publication_location}.`
          },
          {
            action: "Template Selected",
            previousStatus: null,
            newStatus: null,
            actorName: input.triggeredBy,
            note: `${input.generated.templateUsed} dipakai untuk menyusun draft ${input.weather.publication_location}.`
          },
          ...(input.editorialNotes
            ? [
                {
                  action: "Editorial Note Added",
                  previousStatus: null,
                  newStatus: null,
                  actorName: input.triggeredBy,
                  note: input.editorialNotes
                }
              ]
            : [])
        ]
      }
    },
    include: { activityLogs: { orderBy: { createdAt: "desc" } } }
  });
}

function relabelWeather(weather: NormalizedWeather, label: string) {
  return {
    ...weather,
    publication_location: label
  } satisfies NormalizedWeather;
}

function inferLegacyCoverage(location: string): ResolvedCoverage {
  const region = findRegionGroup(location);
  if (region) {
    return {
      coverageType: "single_region",
      regionValues: [region.value],
      regionLabels: [region.label],
      publicationAreas: region.publicationAreas.map((area) => area.label),
      publicationLocationLabel: region.label
    };
  }

  return {
    coverageType: "multiple_publication_areas",
    regionValues: [],
    regionLabels: [],
    publicationAreas: [location],
    publicationLocationLabel: location
  };
}

function resolveCoverage(input: z.infer<typeof runArticleSchema>): ResolvedCoverage {
  if (input.useAllRegion || input.coverageType === "all_region") {
    return {
      coverageType: "all_region",
      regionValues: [...ALL_REGION_OPTION.includedRegions],
      regionLabels: regionLabelsFromValues([...ALL_REGION_OPTION.includedRegions]),
      publicationAreas: resolvePublicationAreas({ coverageType: "all_region" }).map((area) => area.label),
      publicationLocationLabel: ALL_REGION_OPTION.label
    };
  }

  if (!input.coverageType && input.location) {
    return inferLegacyCoverage(input.location);
  }

  const coverageType = input.coverageType ?? "single_region";
  const regionValues = [...new Set(input.selectedRegionGroups ?? [])];
  const publicationAreas = [...new Set(input.selectedPublicationAreas ?? [])];

  if (coverageType === "single_region") {
    const firstRegion = regionValues[0] ?? "jakarta";
    const region = findRegionGroup(firstRegion);
    if (!region) {
      throw new Error("Pilih satu region untuk menjalankan Run Article.");
    }
    return {
      coverageType,
      regionValues: [region.value],
      regionLabels: [region.label],
      publicationAreas: region.publicationAreas.map((area) => area.label),
      publicationLocationLabel: region.label
    };
  }

  if (coverageType === "multiple_regions") {
    const labels = regionLabelsFromValues(regionValues);
    if (!labels.length) {
      throw new Error("Pilih minimal satu region untuk cakupan multi-region.");
    }
    return {
      coverageType,
      regionValues,
      regionLabels: labels,
      publicationAreas: resolvePublicationAreas({ coverageType, regionValues }).map((area) => area.label),
      publicationLocationLabel: coverageLabelFromSelection({ coverageType, regionValues })
    };
  }

  if (!publicationAreas.length) {
    throw new Error("Pilih minimal satu publication area untuk cakupan artikel.");
  }

  return {
    coverageType,
    regionValues,
    regionLabels: regionLabelsFromValues(regionValues),
    publicationAreas,
    publicationLocationLabel: coverageLabelFromSelection({ coverageType, publicationAreas })
  };
}

async function fetchCoverageWeather(scope: ResolvedCoverage, date: Date) {
  const publicationAreaConfigs = resolvePublicationAreas({
    coverageType: scope.coverageType,
    regionValues: scope.regionValues,
    publicationAreas: scope.publicationAreas
  });

  const failures: string[] = [];
  const settled = await Promise.allSettled(
    publicationAreaConfigs.map(async (area) => {
      const weather = await fetchNormalizedWeather(area.sourceKey, date);
      return relabelWeather(weather, area.label);
    })
  );

  const successfulAreas = settled
    .map((result, index) => {
      if (result.status === "rejected") {
        failures.push(
          `${publicationAreaConfigs[index].label}: ${
            result.reason instanceof Error ? result.reason.message : "gagal diambil"
          }`
        );
        return null;
      }
      return result.value;
    })
    .filter((item): item is NormalizedWeather => Boolean(item));

  if (!successfulAreas.length) {
    throw new Error("BMKG weather data is currently unavailable for this coverage. Please try again later.");
  }

  if (scope.coverageType === "multiple_regions" || scope.coverageType === "all_region") {
    const perRegion = scope.regionValues
      .map((regionValue) => {
        const region = findRegionGroup(regionValue);
        if (!region) return null;
        const regionAreas = successfulAreas.filter(
          (item) => findRegionByPublicationArea(item.publication_location)?.value === regionValue
        );
        if (!regionAreas.length) return null;
        return aggregateNormalizedWeatherSet({
          label: region.label,
          coverageType: "single_region",
          date,
          items: regionAreas,
          selectedRegions: [region.label],
          selectedPublicationAreas: region.publicationAreas
            .map((area) => area.label)
            .filter((label) => regionAreas.some((item) => item.publication_location === label))
        });
      })
      .filter(Boolean) as NormalizedWeather[];

    if (!perRegion.length) {
      throw new Error("Data BMKG untuk region terpilih belum cukup untuk membentuk artikel.");
    }

    return aggregateNormalizedWeatherSet({
      label: scope.publicationLocationLabel,
      coverageType: scope.coverageType,
      date,
      items: perRegion,
      selectedRegions: scope.regionLabels,
      selectedPublicationAreas: scope.publicationAreas,
      failures
    });
  }

  return aggregateNormalizedWeatherSet({
    label: scope.publicationLocationLabel,
    coverageType: scope.coverageType,
    date,
    items: successfulAreas,
    selectedRegions: scope.regionLabels,
    selectedPublicationAreas: scope.publicationAreas,
    failures
  });
}

async function createDraftFromWeather(input: {
  weather: NormalizedWeather;
  category: string;
  dataSource: string;
  runType: RunType;
  triggeredBy: string;
  requestedPublishDatetime: Date;
  templatePreference: TemplatePreference;
  editorName?: string | null;
  notes?: string | null;
  activityAction: string;
  activityNote?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const generated = generateArticle(input.weather, input.templatePreference);
  return persistDraft({
    ...input,
    generated,
    editorialNotes: buildEditorialNotes(input.weather)
  });
}

export async function listArticles(searchParams: URLSearchParams) {
  ensureDatabaseConfiguration();
  const where = articleWhere(searchParams);

  const [articles, totalToday, pendingReview, approved, revisionNeeded, rejected] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ generationTime: "desc" }, { id: "desc" }],
      include: { activityLogs: { orderBy: { createdAt: "desc" } } }
    }),
    prisma.article.count({ where: { createdAt: todayRange() } }),
    prisma.article.count({ where: { status: "Pending Review" } }),
    prisma.article.count({ where: { status: "Approved" } }),
    prisma.article.count({ where: { status: "Revision Needed" } }),
    prisma.article.count({ where: { status: "Rejected" } })
  ]);

  return {
    articles,
    summary: {
      totalToday,
      pendingReview,
      approved,
      revisionNeeded,
      rejected
    }
  };
}

export async function getArticle(id: number) {
  ensureDatabaseConfiguration();
  return prisma.article.findUnique({
    where: { id },
    include: { activityLogs: { orderBy: { createdAt: "desc" } } }
  });
}

export async function runManualArticle(input: RunArticleInput) {
  ensureDatabaseConfiguration();
  const parsed = runArticleSchema.parse(input);
  const requestedPublishDatetime = buildRequestedPublishDateOnly(parsed.intendedPublishDate);
  const actorName = parsed.triggeredBy;
  const scope = resolveCoverage(parsed);

  try {
    const weather = await fetchCoverageWeather(
      scope,
      new Date(`${toIsoDate(requestedPublishDatetime)}T00:00:00`)
    );

    return await createDraftFromWeather({
      weather,
      category: parsed.category,
      dataSource: parsed.dataSource,
      runType: "Manual",
      triggeredBy: actorName,
      requestedPublishDatetime,
      templatePreference: parsed.templatePreference,
      editorName: parsed.assignedEditor ?? null,
      notes: combineEditorNotes(parsed.notes, parsed.editorInstruction),
      activityAction: "Article Generated",
      activityNote: `Draft artikel berhasil dibuat untuk cakupan ${scope.publicationLocationLabel}.`,
      metadata: {
        coverage_type: scope.coverageType,
        selected_region_groups: scope.regionValues,
        selected_publication_areas: scope.publicationAreas
      }
    });
  } catch (error) {
    await logError({
      errorType: "manual_generation_error",
      module: "articles",
      action: "manual_generate",
      message: error instanceof Error ? error.message : "Manual article generation failed.",
      technicalDetails: error instanceof Error ? error.stack ?? error.message : String(error),
      location: scope.publicationLocationLabel,
      sourceUrl: process.env.BMKG_SOURCE_URL ?? "https://cuaca.bmkg.go.id/",
      actor: actorName,
      result: "failed"
    });
    throw error;
  }
}

export async function runAutomatedBatchArticles(actorName = process.env.DEFAULT_EDITOR_NAME ?? "Editor Piket") {
  ensureDatabaseConfiguration();
  const date = new Date();
  const requestedPublishDatetime = buildRequestedPublishDateOnly(toIsoDate(date));
  const batchId = `batch-${Date.now()}`;
  const batchTargets = [
    { coverageType: "single_region" as const, regionValues: ["jakarta"], label: "Jakarta" },
    { coverageType: "single_region" as const, regionValues: ["bogor"], label: "Bogor" },
    { coverageType: "single_region" as const, regionValues: ["depok"], label: "Depok" },
    { coverageType: "single_region" as const, regionValues: ["tangerang"], label: "Tangerang" },
    { coverageType: "single_region" as const, regionValues: ["bekasi"], label: "Bekasi" },
    { coverageType: "all_region" as const, regionValues: [...ALL_REGION_OPTION.includedRegions], label: "Jabodetabek" }
  ];

  const results = [];
  const failures: string[] = [];

  for (const target of batchTargets) {
    const scope = resolveCoverage({
      category: "Cuaca",
      dataSource: "BMKG",
      intendedPublishDate: toIsoDate(date),
      templatePreference: "Auto",
      assignedEditor: "Editor Piket",
      notes: null,
      triggeredBy: actorName,
      editorInstruction: null,
      coverageType: target.coverageType,
      selectedRegionGroups: target.regionValues,
      selectedPublicationAreas: [],
      useAllRegion: target.coverageType === "all_region"
    });

    try {
      const weather = await fetchCoverageWeather(scope, date);
      const article = await createDraftFromWeather({
        weather,
        category: "Cuaca",
        dataSource: "BMKG",
        runType: "Automated Manual",
        triggeredBy: actorName,
        requestedPublishDatetime,
        templatePreference: "Auto",
        editorName: "Editor Piket",
        notes: null,
        activityAction: "Automated Batch Article Generated",
        activityNote: `Batch ${batchId} menghasilkan draft untuk ${scope.publicationLocationLabel}.`,
        metadata: {
          batch_id: batchId,
          batch_name: "Automated Generate Articles",
          is_batch_generated: true,
          coverage_type: scope.coverageType,
          selected_region_groups: scope.regionValues,
          selected_publication_areas: scope.publicationAreas
        }
      });
      results.push(article);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Automated batch generation failed.";
      failures.push(`${target.label}: ${message}`);
      await logError({
        errorType: "automated_batch_generation_error",
        module: "batch",
        action: "automated_generate_articles",
        message,
        technicalDetails: error instanceof Error ? error.stack ?? error.message : String(error),
        location: target.label,
        sourceUrl: process.env.BMKG_SOURCE_URL ?? "https://cuaca.bmkg.go.id/",
        actor: actorName,
        result: batchId
      });
    }
  }

  if (!results.length) {
    throw new Error(
      failures.length
        ? `Automated batch generation failed for all coverage groups. ${failures.join(" | ")}`
        : "Automated batch generation failed for all coverage groups."
    );
  }

  return {
    articles: results,
    failures,
    batchId
  };
}

export async function runScheduledArticles(actorName = process.env.DEFAULT_EDITOR_NAME ?? "Editor Piket") {
  return runAutomatedBatchArticles(actorName);
}

export async function updateArticleWorkflow(
  id: number,
  input: {
    status?: ArticleStatus;
    notes?: string | null;
    editorName?: string | null;
    bodyText?: string;
    actorName?: string;
  }
) {
  ensureDatabaseConfiguration();
  const parsed = workflowSchema.parse(input);
  const article = await prisma.article.findUnique({ where: { id } });

  if (!article) {
    throw new Error("Artikel tidak ditemukan.");
  }

  const actorName = parsed.actorName || process.env.DEFAULT_EDITOR_NAME || "Editor Piket";
  const changedStatus = parsed.status && parsed.status !== article.status;
  const changedNotes = parsed.notes !== undefined && parsed.notes !== article.notes;
  const changedEditor = parsed.editorName !== undefined && parsed.editorName !== article.editorName;
  const changedBody = parsed.bodyText !== undefined && parsed.bodyText !== article.bodyText;

  if (!changedStatus && !changedNotes && !changedEditor && !changedBody) {
    return getArticle(id);
  }

  const action = changedStatus
    ? "Status Changed"
    : changedBody
      ? "Article Body Edited"
      : changedEditor
        ? "Editor Assigned"
        : "Editor Note Updated";

  const note = changedBody
    ? "Article body was edited from the draft view."
    : parsed.notes !== undefined
      ? parsed.notes
      : changedEditor
        ? `Assigned editor: ${parsed.editorName ?? "Belum ditetapkan"}`
        : null;

  try {
    return await prisma.article.update({
      where: { id },
      data: {
        ...(parsed.status ? { status: parsed.status } : {}),
        ...(parsed.notes !== undefined ? { notes: parsed.notes } : {}),
        ...(parsed.editorName !== undefined ? { editorName: parsed.editorName } : {}),
        ...(parsed.bodyText !== undefined ? { bodyText: parsed.bodyText } : {}),
        activityLogs: {
          create: {
            action,
            previousStatus: changedStatus ? article.status : null,
            newStatus: changedStatus ? parsed.status : null,
            actorName,
            note
          }
        }
      },
      include: { activityLogs: { orderBy: { createdAt: "desc" } } }
    });
  } catch (error) {
    await logError({
      errorType: "workflow_update_error",
      module: "articles",
      action: "update_workflow",
      message: error instanceof Error ? error.message : "Failed to update article workflow.",
      technicalDetails: error instanceof Error ? error.stack ?? error.message : String(error),
      articleId: id,
      location: article.location,
      sourceUrl: article.sourceUrl,
      actor: actorName,
      result: "failed"
    });
    throw new Error("Gagal menyimpan perubahan artikel. Silakan coba lagi.");
  }
}

export async function runArticleGenerationFromWeather(input: {
  weather: NormalizedWeather;
  templatePreference?: TemplatePreference;
}) {
  const templatePreference = input.templatePreference ?? "Auto";
  return generateArticle(input.weather, templatePreference);
}

export async function listLogs(searchParams: URLSearchParams) {
  ensureDatabaseConfiguration();
  const date = searchParams.get("date")?.trim();
  const moduleFilter = searchParams.get("module")?.trim();
  const actorFilter = searchParams.get("actor")?.trim();
  const locationFilter = searchParams.get("location")?.trim();
  const resultFilter = searchParams.get("result")?.trim();

  const [activityLogs, errorLogs] = await Promise.all([
    prisma.activityLog.findMany({
      where: {
        ...(date
          ? { createdAt: { gte: new Date(`${date}T00:00:00`), lt: new Date(`${date}T23:59:59`) } }
          : {}),
        ...(actorFilter ? { actorName: { contains: actorFilter } } : {}),
        ...(resultFilter && resultFilter !== "failed" ? { newStatus: resultFilter } : {})
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            location: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 250
    }),
    prisma.errorLog.findMany({
      where: {
        ...(date
          ? { createdAt: { gte: new Date(`${date}T00:00:00`), lt: new Date(`${date}T23:59:59`) } }
          : {}),
        ...(moduleFilter ? { module: { contains: moduleFilter } } : {}),
        ...(actorFilter ? { actor: { contains: actorFilter } } : {}),
        ...(locationFilter ? { location: { contains: locationFilter } } : {}),
        ...(resultFilter ? { result: { contains: resultFilter } } : {})
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            location: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 250
    })
  ]);

  const normalizedActivityLogs = activityLogs
    .filter((log) => (locationFilter ? log.article.location.includes(locationFilter) : true))
    .map((log) => ({
      id: `activity-${log.id}`,
      kind: "activity" as const,
      timestamp: log.createdAt,
      module: actionModule(log.action),
      action: log.action,
      actor: log.actorName,
      articleId: log.articleId,
      articleTitle: log.article.title,
      location: log.article.location,
      statusOrResult: log.newStatus ?? log.article.status,
      message: log.note ?? log.action
    }));

  const normalizedErrorLogs = errorLogs.map((log) => ({
    id: `error-${log.id}`,
    kind: "error" as const,
    timestamp: log.createdAt,
    module: log.module,
    action: log.action,
    actor: log.actor ?? "System",
    articleId: log.articleId,
    articleTitle: log.article?.title ?? null,
    location: log.location ?? log.article?.location ?? "-",
    statusOrResult: log.result ?? "failed",
    message: log.message
  }));

  const logs = [...normalizedActivityLogs, ...normalizedErrorLogs]
    .filter((log) => (moduleFilter ? `${log.module} ${log.action}`.toLowerCase().includes(moduleFilter.toLowerCase()) : true))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    logs,
    summary: {
      total: logs.length,
      activity: normalizedActivityLogs.length,
      error: normalizedErrorLogs.length
    }
  };
}

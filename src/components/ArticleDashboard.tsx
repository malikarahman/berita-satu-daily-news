"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Copy,
  FileText,
  Filter,
  Layers3,
  Play,
  Search,
  Send,
  Sparkles,
  UserRound,
  X,
  XCircle
} from "lucide-react";
import { TEMPLATE_DESCRIPTIONS, TEMPLATE_OPTIONS } from "@/data/articleTemplates";
import {
  ALL_REGION_OPTION,
  listPublicationAreaOptions,
  listRegionOptions,
  type PublicationAreaOption
} from "@/data/coverageGroups";
import { DEFAULT_EDITORS } from "@/data/editors";
import { ARTICLE_STATUSES } from "@/lib/articles/types";

type ActivityLog = {
  id: number;
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  actorName: string;
  note: string | null;
  createdAt: string;
};

type Article = {
  id: number;
  sourceName: string;
  sourceUrl: string;
  dataSource: string;
  category: string;
  location: string;
  date: string;
  dayName: string;
  title: string;
  previewText: string;
  bodyText: string;
  weatherPayloadJson: string;
  draftUrl: string | null;
  templatePreference: string | null;
  selectedTemplate: string | null;
  editorialNotes: string | null;
  dataCompletenessNote: string | null;
  runType: string;
  triggeredBy: string;
  generationTime: string;
  requestedPublishDatetime: string;
  status: string;
  editorName: string | null;
  notes: string | null;
  activityLogs: ActivityLog[];
};

type Summary = {
  totalToday: number;
  pendingReview: number;
  approved: number;
  revisionNeeded: number;
  rejected: number;
};

type CoverageType = "single_region" | "multiple_publication_areas" | "multiple_regions" | "all_region";

const REGION_OPTIONS = listRegionOptions();
const PUBLICATION_AREA_OPTIONS = listPublicationAreaOptions();
const EDITORS = [...DEFAULT_EDITORS];
const RUN_TYPE_OPTIONS = ["Manual", "Automated Manual", "Scheduled"] as const;
const BATCH_TARGETS = ["Jakarta", "Bogor", "Depok", "Tangerang", "Bekasi", "Jabodetabek"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function statusClass(status: string) {
  switch (status) {
    case "Approved":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "Revision Needed":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    case "Rejected":
      return "bg-brand-redSoft text-brand-red ring-red-200";
    case "Generated":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-brand-goldSoft text-brand-navy ring-brand-gold/50";
  }
}

function todayLabel() {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

function articleSummaryLabel(article: Article) {
  return article.notes ?? (article.editorialNotes ? "Catatan sistem tersedia" : "-");
}

export function ArticleDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selected, setSelected] = useState<Article | null>(null);
  const [summary, setSummary] = useState<Summary>({
    totalToday: 0,
    pendingReview: 0,
    approved: 0,
    revisionNeeded: 0,
    rejected: 0
  });
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    date: "",
    location: "",
    status: "",
    runType: "",
    editor: ""
  });
  const [runOpen, setRunOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters, query]);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/articles${queryString ? `?${queryString}` : ""}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setArticles(payload.articles);
      setSummary(payload.summary);
      setSelected((prev) => (prev ? payload.articles.find((item: Article) => item.id === prev.id) ?? null : null));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat daftar artikel.");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    function syncSelectedFromUrl() {
      const url = new URL(window.location.href);
      const rawArticleId = url.searchParams.get("article");
      if (!rawArticleId) {
        setSelected(null);
        return;
      }

      const articleId = Number(rawArticleId);
      if (!Number.isFinite(articleId)) {
        setSelected(null);
        return;
      }

      setSelected((prev) => {
        if (prev?.id === articleId) return prev;
        return articles.find((item) => item.id === articleId) ?? null;
      });
    }

    syncSelectedFromUrl();
    window.addEventListener("popstate", syncSelectedFromUrl);
    return () => window.removeEventListener("popstate", syncSelectedFromUrl);
  }, [articles]);

  function openArticle(article: Article) {
    const url = new URL(window.location.href);
    if (url.searchParams.get("article") !== String(article.id)) {
      url.searchParams.set("article", String(article.id));
      window.history.pushState({ articleId: article.id }, "", url);
    }
    setSelected(article);
  }

  function closeArticle() {
    setSelected(null);
    const url = new URL(window.location.href);
    if (url.searchParams.get("article")) {
      url.searchParams.delete("article");
      window.history.replaceState({}, "", url);
    }
  }

  async function updateArticle(
    id: number,
    input: { status?: string; notes?: string | null; editorName?: string | null; bodyText?: string }
  ) {
    setSaving(true);
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, actorName: "Editor Piket" })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setSelected(payload.article);
      await loadArticles();
      setMessage("Perubahan artikel berhasil disimpan.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memperbarui artikel.");
    } finally {
      setSaving(false);
    }
  }

  async function runAutomatedBatch() {
    setSaving(true);
    try {
      const response = await fetch("/api/articles/automated-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorName: "Editor Piket" })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      const failureText = payload.failures?.length
        ? ` ${payload.failures.length} cakupan gagal dan tercatat di log.`
        : "";
      setMessage(`${payload.count} artikel batch berhasil dibuat.${failureText}`);
      setBatchOpen(false);
      await loadArticles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Automated batch generation gagal.");
    } finally {
      setSaving(false);
    }
  }

  const summaryCards = [
    {
      label: "Hari Ini",
      value: todayLabel(),
      subtle: true,
      tone: "text-brand-navy"
    },
    { label: "Total Articles Today", value: String(summary.totalToday), tone: "text-brand-navy" },
    { label: "Pending Review", value: String(summary.pendingReview), tone: "text-brand-navy" },
    { label: "Approved", value: String(summary.approved), tone: "text-emerald-700" },
    { label: "Revision Needed", value: String(summary.revisionNeeded), tone: "text-orange-700" },
    { label: "Rejected", value: String(summary.rejected), tone: "text-brand-red" }
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-6 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-md border border-newsroom-line p-4 shadow-subtle ${
              card.subtle ? "bg-brand-navy text-white" : "bg-white"
            }`}
          >
            <div className={`text-sm ${card.subtle ? "text-white/70" : "text-newsroom-muted"}`}>{card.label}</div>
            <div className={`mt-3 text-2xl font-semibold ${card.subtle ? "text-white" : card.tone}`}>
              {card.value}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-md border border-newsroom-line bg-white p-4 shadow-subtle">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[320px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-newsroom-muted" size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari judul artikel atau lokasi"
              className="h-10 w-full rounded-md border border-newsroom-line pl-10 pr-3 text-sm outline-none focus:border-brand-red"
            />
          </div>

          <div className="flex items-center gap-2 text-newsroom-muted">
            <Filter size={16} />
            <span className="text-sm font-medium">Filter</span>
          </div>

          <input
            type="date"
            value={filters.date}
            onChange={(event) => setFilters((prev) => ({ ...prev, date: event.target.value }))}
            className="h-10 rounded-md border border-newsroom-line px-3 text-sm"
          />
          <input
            value={filters.location}
            onChange={(event) => setFilters((prev) => ({ ...prev, location: event.target.value }))}
            placeholder="Semua lokasi"
            className="h-10 rounded-md border border-newsroom-line px-3 text-sm"
          />
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="h-10 rounded-md border border-newsroom-line px-3 text-sm"
          >
            <option value="">Semua status</option>
            {ARTICLE_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <select
            value={filters.runType}
            onChange={(event) => setFilters((prev) => ({ ...prev, runType: event.target.value }))}
            className="h-10 rounded-md border border-newsroom-line px-3 text-sm"
          >
            <option value="">Semua run type</option>
            {RUN_TYPE_OPTIONS.map((runType) => (
              <option key={runType}>{runType}</option>
            ))}
          </select>
          <select
            value={filters.editor}
            onChange={(event) => setFilters((prev) => ({ ...prev, editor: event.target.value }))}
            className="h-10 rounded-md border border-newsroom-line px-3 text-sm"
          >
            <option value="">Semua editor</option>
            {EDITORS.map((editor) => (
              <option key={editor}>{editor}</option>
            ))}
          </select>

          <button
            onClick={() =>
              setFilters({
                date: "",
                location: "",
                status: "",
                runType: "",
                editor: ""
              })
            }
            className="h-10 rounded-md border border-newsroom-line px-3 text-sm font-medium text-newsroom-ink"
          >
            Reset
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex-1">{message ? <MessageBanner message={message} /> : null}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBatchOpen(true)}
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-newsroom-line bg-white px-3 text-sm font-medium text-newsroom-ink"
            >
              <Layers3 size={16} />
              Automated Generate Articles
            </button>
            <button
              onClick={() => setRunOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-red px-4 text-sm font-semibold text-white"
            >
              <Play size={16} />
              Run Article
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-newsroom-line bg-white shadow-subtle">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-brand-navy/5 text-xs uppercase text-newsroom-muted">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Article Title</th>
              <th className="px-4 py-3">Run Type</th>
              <th className="px-4 py-3">Triggered By</th>
              <th className="px-4 py-3">Generated At</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned Editor</th>
              <th className="px-4 py-3">Draft</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-newsroom-line">
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-newsroom-muted">
                  Loading articles...
                </td>
              </tr>
            ) : articles.length ? (
              articles.map((article) => (
                <tr key={article.id} className="hover:bg-newsroom-surface/70">
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(article.date)}</td>
                  <td className="px-4 py-3 font-medium">{article.location}</td>
                  <td className="max-w-[360px] px-4 py-3">
                    <button
                      onClick={() => openArticle(article)}
                      className="text-left font-medium text-brand-navy hover:text-brand-red hover:underline"
                    >
                      {article.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">{article.runType}</td>
                  <td className="px-4 py-3">{article.triggeredBy}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDateTime(article.generationTime)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClass(article.status)}`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{article.editorName ?? "-"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openArticle(article)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-newsroom-line px-2 text-xs font-medium"
                    >
                      <FileText size={14} />
                      View
                    </button>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-newsroom-muted">
                    {articleSummaryLabel(article)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-newsroom-muted">
                  Belum ada artikel. Jalankan Run Article atau Automated Generate Articles terlebih dahulu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {runOpen ? <RunArticleModal onClose={() => setRunOpen(false)} onCreated={loadArticles} /> : null}
      {batchOpen ? (
        <AutomatedBatchModal
          saving={saving}
          onClose={() => setBatchOpen(false)}
          onConfirm={runAutomatedBatch}
        />
      ) : null}
      {selected ? (
        <ArticleDetailDrawer
          article={selected}
          saving={saving}
          onClose={closeArticle}
          onUpdate={updateArticle}
        />
      ) : null}
    </div>
  );
}

function MessageBanner({ message }: { message: string }) {
  const lowered = message.toLowerCase();
  const tone = lowered.includes("gagal") || lowered.includes("failed") ? "rose" : "blue";
  return (
    <div
      className={`rounded-md px-3 py-2 text-sm ${
        tone === "rose" ? "bg-rose-50 text-rose-700" : "bg-brand-navySoft text-brand-navy"
      }`}
    >
      {message}
    </div>
  );
}

function AutomatedBatchModal({
  saving,
  onClose,
  onConfirm
}: {
  saving: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 px-4">
      <div className="w-full max-w-xl rounded-md bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-newsroom-line px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-newsroom-ink">Automated Generate Articles</h2>
            <p className="mt-1 text-sm text-newsroom-muted">
              Manual trigger untuk batch article generation dari cakupan default newsroom.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="rounded-md border border-brand-gold/40 bg-brand-goldSoft px-4 py-3 text-sm text-brand-navy">
            Sistem akan membuat draft artikel untuk cakupan berikut:
          </div>
          <div className="grid grid-cols-2 gap-3">
            {BATCH_TARGETS.map((target) => (
              <div key={target} className="rounded-md border border-newsroom-line bg-newsroom-surface px-3 py-3 text-sm font-medium text-newsroom-ink">
                {target}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-newsroom-line px-5 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-newsroom-line px-4 text-sm font-medium">
            Batal
          </button>
          <button
            disabled={saving}
            onClick={onConfirm}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-red px-4 text-sm font-semibold text-white"
          >
            <Sparkles size={16} />
            Generate Batch
          </button>
        </div>
      </div>
    </div>
  );
}

function RunArticleModal({
  onClose,
  onCreated
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    coverageType: "single_region" as CoverageType,
    selectedRegionGroups: ["jakarta"],
    selectedPublicationAreas: [] as string[],
    dataSource: "BMKG",
    templatePreference: "Auto",
    assignedEditor: "Editor Piket",
    notes: "",
    editorInstruction: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const areaOptions = useMemo<PublicationAreaOption[]>(
    () =>
      form.coverageType === "multiple_publication_areas"
        ? listPublicationAreaOptions(form.selectedRegionGroups)
        : PUBLICATION_AREA_OPTIONS,
    [form.coverageType, form.selectedRegionGroups]
  );

  function toggleListValue(key: "selectedRegionGroups" | "selectedPublicationAreas", value: string) {
    setForm((prev) => {
      const exists = prev[key].includes(value);
      return {
        ...prev,
        [key]: exists ? prev[key].filter((item) => item !== value) : [...prev[key], value]
      };
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/articles/manual-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "Cuaca",
          dataSource: form.dataSource,
          coverageType: form.coverageType,
          selectedRegionGroups: form.selectedRegionGroups,
          selectedPublicationAreas: form.selectedPublicationAreas,
          useAllRegion: form.coverageType === "all_region",
          templatePreference: form.templatePreference,
          assignedEditor: form.assignedEditor,
          notes: form.notes,
          editorInstruction: form.editorInstruction,
          triggeredBy: "Editor Piket"
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      await onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run Article gagal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 px-4">
      <form onSubmit={submit} className="w-full max-w-4xl rounded-md bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-newsroom-line px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-newsroom-ink">Run Article</h2>
            <p className="mt-1 text-sm text-newsroom-muted">
              Custom generation untuk single region, publication areas, multiple regions, atau seluruh Jabodetabek.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 px-5 py-5">
          <Field label="Generation Scope">
            <select
              value={form.coverageType}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  coverageType: event.target.value as CoverageType,
                  selectedRegionGroups: prev.selectedRegionGroups.length ? prev.selectedRegionGroups : ["jakarta"],
                  selectedPublicationAreas: []
                }))
              }
              className="h-10 w-full rounded-md border border-newsroom-line px-3"
            >
              <option value="single_region">Single Region</option>
              <option value="multiple_publication_areas">Multiple Publication Areas</option>
              <option value="multiple_regions">Multiple Regions</option>
              <option value="all_region">All Region: Jabodetabek</option>
            </select>
          </Field>
          <Field label="Data Source">
            <input readOnly value={form.dataSource} className="h-10 w-full rounded-md border border-newsroom-line bg-slate-50 px-3" />
          </Field>

          <Field label="Template Preference">
            <select
              value={form.templatePreference}
              onChange={(event) => setForm((prev) => ({ ...prev, templatePreference: event.target.value }))}
              className="h-10 w-full rounded-md border border-newsroom-line px-3"
            >
              {TEMPLATE_OPTIONS.map((template) => (
                <option key={template} value={template}>
                  {template}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-newsroom-muted">
              {TEMPLATE_DESCRIPTIONS[form.templatePreference as keyof typeof TEMPLATE_DESCRIPTIONS]}
            </p>
          </Field>
          <Field label="Assigned Editor">
            <select
              value={form.assignedEditor}
              onChange={(event) => setForm((prev) => ({ ...prev, assignedEditor: event.target.value }))}
              className="h-10 w-full rounded-md border border-newsroom-line px-3"
            >
              {EDITORS.map((editor) => (
                <option key={editor}>{editor}</option>
              ))}
            </select>
          </Field>

          <Field label="Coverage Selection" className="col-span-2">
            {form.coverageType === "all_region" ? (
              <div className="rounded-md border border-brand-gold/40 bg-brand-goldSoft px-4 py-3 text-sm text-brand-navy">
                Seluruh region dalam mode ini akan digabung menjadi artikel bertajuk {ALL_REGION_OPTION.label}.
              </div>
            ) : form.coverageType === "single_region" ? (
              <div className="grid grid-cols-5 gap-2">
                {REGION_OPTIONS.map((region) => (
                  <button
                    key={region.value}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, selectedRegionGroups: [region.value], selectedPublicationAreas: [] }))
                    }
                    className={`rounded-md border px-3 py-2 text-sm font-medium ${
                      form.selectedRegionGroups[0] === region.value
                        ? "border-brand-red bg-brand-redSoft text-brand-red"
                        : "border-newsroom-line text-newsroom-ink"
                    }`}
                  >
                    {region.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {form.coverageType === "multiple_publication_areas" ? (
                  <div className="flex flex-wrap gap-2">
                    {REGION_OPTIONS.map((region) => (
                      <button
                        key={region.value}
                        type="button"
                        onClick={() => toggleListValue("selectedRegionGroups", region.value)}
                        className={`rounded-md border px-3 py-2 text-sm font-medium ${
                          form.selectedRegionGroups.includes(region.value)
                            ? "border-brand-red bg-brand-redSoft text-brand-red"
                            : "border-newsroom-line text-newsroom-ink"
                        }`}
                      >
                        {region.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="max-h-52 overflow-y-auto rounded-md border border-newsroom-line p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {(form.coverageType === "multiple_regions" ? REGION_OPTIONS : areaOptions).map((item) => {
                      const value = "value" in item ? item.value : item.label;
                      const checked =
                        form.coverageType === "multiple_regions"
                          ? form.selectedRegionGroups.includes(value)
                          : form.selectedPublicationAreas.includes(value);

                      return (
                        <label
                          key={value}
                          className="flex items-center gap-2 rounded-md border border-newsroom-line px-3 py-2 text-sm text-newsroom-ink"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleListValue(
                                form.coverageType === "multiple_regions"
                                  ? "selectedRegionGroups"
                                  : "selectedPublicationAreas",
                                value
                              )
                            }
                          />
                          <span>{item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </Field>

          <Field label="Catatan" className="col-span-2">
            <textarea
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="min-h-24 w-full rounded-md border border-newsroom-line px-3 py-2"
            />
          </Field>
          <Field label="Editor Instruction" className="col-span-2">
            <textarea
              value={form.editorInstruction}
              onChange={(event) => setForm((prev) => ({ ...prev, editorInstruction: event.target.value }))}
              className="min-h-24 w-full rounded-md border border-newsroom-line px-3 py-2"
            />
          </Field>
        </div>

        {error ? <div className="mx-5 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

        <div className="flex justify-end gap-2 border-t border-newsroom-line px-5 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-newsroom-line px-4 text-sm font-medium">
            Cancel
          </button>
          <button
            disabled={submitting}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-red px-4 text-sm font-semibold text-white"
          >
            <Send size={16} />
            Generate Draft
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  className
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium text-newsroom-ink ${className ?? ""}`}>
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function ArticleDetailDrawer({
  article,
  saving,
  onClose,
  onUpdate
}: {
  article: Article;
  saving: boolean;
  onClose: () => void;
  onUpdate: (id: number, input: { status?: string; notes?: string | null; editorName?: string | null; bodyText?: string }) => Promise<void>;
}) {
  const [notes, setNotes] = useState(article.notes ?? "");
  const [editorName, setEditorName] = useState(article.editorName ?? "");
  const [bodyText, setBodyText] = useState(article.bodyText);
  const [selectedSnippet, setSelectedSnippet] = useState("");
  const [copied, setCopied] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setNotes(article.notes ?? "");
    setEditorName(article.editorName ?? "");
    setBodyText(article.bodyText);
    setSelectedSnippet("");
    setCopied(false);
  }, [article.id, article.notes, article.editorName, article.bodyText]);

  function updateSelection() {
    const element = bodyRef.current;
    if (!element) return;
    const nextSelection = element.value.slice(element.selectionStart, element.selectionEnd).trim();
    setSelectedSnippet(nextSelection);
    if (!nextSelection) {
      setCopied(false);
    }
  }

  async function copySelectedText() {
    if (!selectedSnippet) return;
    await navigator.clipboard.writeText(selectedSnippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <>
      <div className="fixed inset-0 z-30 flex justify-end">
        <div className="absolute inset-0 bg-slate-950/25" onClick={onClose} />
        <aside className="relative z-10 flex h-full w-full max-w-[760px] flex-col overflow-hidden border-l border-newsroom-line bg-white shadow-xl">
        <div className="sticky top-0 z-10 border-b border-newsroom-line bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-md border border-newsroom-line px-3 py-1.5 text-sm font-medium text-newsroom-ink"
              >
                <ChevronLeft size={15} />
                Back to Dashboard
              </button>
              <h2 className="mt-3 text-lg font-semibold leading-6 text-newsroom-ink">{article.title}</h2>
              <div className="mt-2 flex items-center gap-2 text-sm text-newsroom-muted">
                <span>{article.location}</span>
                <span>{formatDate(article.date)}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ring-1 ${statusClass(article.status)}`}>
                  {article.status}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="rounded-md p-1 hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Meta label="Source Name" value={article.sourceName} />
            <Meta label="Source URL" value={article.sourceUrl} />
            <Meta label="Run Type" value={article.runType} />
            <Meta label="Triggered By" value={article.triggeredBy} />
            <Meta label="Generated At" value={formatDateTime(article.generationTime)} />
            <Meta label="Selected Template" value={article.selectedTemplate ?? article.templatePreference ?? "Auto"} />
            <Meta label="Assigned Editor" value={article.editorName ?? "-"} />
            <Meta label="Category" value={article.category} />
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-newsroom-line px-3 text-sm font-medium"
            >
              <Layers3 size={15} />
              Open Source
            </a>
            <button
              onClick={() => bodyRef.current?.focus()}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-newsroom-line px-3 text-sm font-medium"
            >
              <FileText size={15} />
              Open Draft
            </button>
          </div>

          {article.editorialNotes ? (
            <div className="rounded-md border border-brand-gold/40 bg-brand-goldSoft px-4 py-3 text-sm text-brand-navy">
              <div className="font-semibold">Catatan Redaksi</div>
              <p className="mt-1 leading-6">{article.editorialNotes}</p>
            </div>
          ) : null}

          <section>
            <h3 className="text-sm font-semibold uppercase text-newsroom-muted">Preview</h3>
            <p className="mt-2 rounded-md bg-newsroom-surface p-3 text-sm leading-6">{article.previewText}</p>
          </section>

          <section id="draft-preview">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase text-newsroom-muted">Generated Article Body</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copySelectedText}
                  disabled={!selectedSnippet}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-newsroom-line px-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Copy size={13} />
                  {copied ? "Copied" : "Copy Selected Text"}
                </button>
                <button
                  disabled={saving || bodyText === article.bodyText}
                  onClick={() => onUpdate(article.id, { bodyText })}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-newsroom-line px-2 text-xs font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
            <textarea
              ref={bodyRef}
              value={bodyText}
              onChange={(event) => setBodyText(event.target.value)}
              onSelect={updateSelection}
              onKeyUp={updateSelection}
              onMouseUp={updateSelection}
              readOnly={false}
              spellCheck={false}
              className="mt-2 min-h-[280px] w-full rounded-md border border-newsroom-line p-4 text-[15px] leading-7 outline-none focus:border-brand-red"
            />
          </section>

          {article.dataCompletenessNote && article.dataCompletenessNote !== article.editorialNotes ? (
            <section>
              <h3 className="text-sm font-semibold uppercase text-newsroom-muted">Data Completeness</h3>
              <p className="mt-2 rounded-md bg-newsroom-surface p-3 text-sm leading-6 text-newsroom-muted">
                {article.dataCompletenessNote}
              </p>
            </section>
          ) : null}

          <section className="grid grid-cols-2 gap-4">
            <Field label="Assign Editor">
              <div className="flex gap-2">
                <select
                  value={editorName}
                  onChange={(event) => setEditorName(event.target.value)}
                  className="h-10 flex-1 rounded-md border border-newsroom-line px-3"
                >
                  <option value="">Belum ditetapkan</option>
                  {EDITORS.map((editor) => (
                    <option key={editor}>{editor}</option>
                  ))}
                </select>
                <button
                  disabled={saving}
                  onClick={() => onUpdate(article.id, { editorName: editorName || null })}
                  className="inline-flex h-10 items-center gap-1 rounded-md border border-newsroom-line px-3 text-sm font-medium"
                >
                  <UserRound size={15} />
                  Save
                </button>
              </div>
            </Field>
            <Field label="Status">
              <select
                value={article.status}
                onChange={(event) => onUpdate(article.id, { status: event.target.value })}
                className="h-10 w-full rounded-md border border-newsroom-line px-3"
              >
                {ARTICLE_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </Field>
          </section>

          <section>
            <Field label="Catatan">
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-24 w-full rounded-md border border-newsroom-line px-3 py-2"
              />
            </Field>
            <button
              disabled={saving}
              onClick={() => onUpdate(article.id, { notes })}
              className="mt-2 inline-flex h-9 items-center gap-2 rounded-md border border-newsroom-line px-3 text-sm font-medium"
            >
              Save Notes
            </button>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase text-newsroom-muted">Editorial Actions</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                disabled={saving}
                onClick={() => onUpdate(article.id, { status: "Approved" })}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white"
              >
                <CheckCircle2 size={15} />
                Approve
              </button>
              <button
                disabled={saving}
                onClick={() => onUpdate(article.id, { status: "Revision Needed" })}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-orange-600 px-3 text-sm font-semibold text-white"
              >
                <Clock3 size={15} />
                Mark Revision Needed
              </button>
              <button
                disabled={saving}
                onClick={() => onUpdate(article.id, { status: "Rejected" })}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-red px-3 text-sm font-semibold text-white"
              >
                <XCircle size={15} />
                Reject
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase text-newsroom-muted">BMKG Source Data Used</h3>
            <pre className="mt-2 overflow-x-auto rounded-md border border-newsroom-line bg-slate-950 p-4 text-xs leading-6 text-slate-100">
              {article.weatherPayloadJson}
            </pre>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase text-newsroom-muted">Activity Log / History</h3>
            <div className="mt-2 divide-y divide-newsroom-line rounded-md border border-newsroom-line">
              {article.activityLogs.length ? (
                article.activityLogs.map((log) => (
                  <div key={log.id} className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-newsroom-ink">{log.action}</span>
                      <span className="text-xs text-newsroom-muted">{formatDateTime(log.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-newsroom-muted">
                      {log.actorName}
                      {log.newStatus ? ` -> ${log.newStatus}` : ""}
                    </p>
                    {log.note ? <p className="mt-1 leading-6 text-newsroom-muted">{log.note}</p> : null}
                  </div>
                ))
              ) : (
                <div className="px-4 py-5 text-sm text-newsroom-muted">Belum ada histori aktivitas.</div>
            )}
          </div>
        </section>
        </div>
      </aside>
      </div>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-newsroom-surface p-3">
      <div className="text-xs uppercase text-newsroom-muted">{label}</div>
      <div className="mt-1 break-words font-medium text-newsroom-ink">{value}</div>
    </div>
  );
}

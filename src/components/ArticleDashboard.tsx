"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  PenLine,
  Play,
  RefreshCcw,
  Search,
  Send,
  UserRound,
  X,
  XCircle
} from "lucide-react";
import { ARTICLE_STATUSES, TEMPLATE_PREFERENCES } from "@/lib/articles/types";

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
  category: string;
  location: string;
  date: string;
  dayName: string;
  title: string;
  previewText: string;
  bodyText: string;
  weatherPayloadJson: string;
  draftUrl: string | null;
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

const LOCATIONS = ["Jakarta", "Tangerang Selatan", "Depok", "Bekasi", "Bogor"];
const EDITORS = ["Editor Piket", "Dina Pramesti", "Raka Mahendra", "Maya Sari"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentTime() {
  return new Date().toTimeString().slice(0, 5);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

function statusClass(status: string) {
  switch (status) {
    case "Approved":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "Revision Needed":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    case "Rejected":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "Generated":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

export function ArticleDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalToday: 0,
    pendingReview: 0,
    approved: 0,
    revisionNeeded: 0,
    rejected: 0
  });
  const [selected, setSelected] = useState<Article | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    date: "",
    location: "",
    category: "",
    status: "",
    runType: "",
    editor: ""
  });
  const [runOpen, setRunOpen] = useState(false);
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

  async function loadArticles() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/articles${queryString ? `?${queryString}` : ""}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setArticles(payload.articles);
      setSummary(payload.summary);
      if (selected) {
        const refreshed = payload.articles.find((article: Article) => article.id === selected.id);
        setSelected(refreshed ?? null);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArticles();
  }, [queryString]);

  async function updateSelected(input: { status?: string; notes?: string | null; editorName?: string | null }) {
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/articles/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, actorName: "Editor Piket" })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setSelected(payload.article);
      await loadArticles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  }

  async function runScheduledTest() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/articles/scheduled-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorName: "System Test" })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setMessage(`${payload.count} artikel scheduled berhasil dibuat.`);
      await loadArticles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Scheduled run gagal.");
    } finally {
      setSaving(false);
    }
  }

  const summaryCards = [
    { label: "Total Articles Today", value: summary.totalToday, icon: FileText, tone: "text-blue-700" },
    { label: "Pending Review", value: summary.pendingReview, icon: Clock3, tone: "text-slate-700" },
    { label: "Approved", value: summary.approved, icon: CheckCircle2, tone: "text-emerald-700" },
    { label: "Revision Needed", value: summary.revisionNeeded, icon: PenLine, tone: "text-amber-700" },
    { label: "Rejected", value: summary.rejected, icon: XCircle, tone: "text-rose-700" }
  ];

  return (
    <main className="min-h-screen">
      <header className="border-b border-newsroom-line bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-normal text-newsroom-ink">Berita Satu Daily News</h1>
            <p className="mt-1 text-sm text-newsroom-muted">Weather article workflow dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runScheduledTest}
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-newsroom-line bg-white px-3 text-sm font-medium text-newsroom-ink shadow-subtle hover:bg-slate-50"
            >
              <RefreshCcw size={16} />
              Test Scheduled Run
            </button>
            <button
              onClick={() => setRunOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-newsroom-red px-4 text-sm font-semibold text-white shadow-subtle hover:bg-red-800"
            >
              <Play size={16} />
              Run Article
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-6 py-6">
        <div className="grid grid-cols-5 gap-3">
          {summaryCards.map((item) => (
            <div key={item.label} className="rounded-md border border-newsroom-line bg-white p-4 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-sm text-newsroom-muted">{item.label}</span>
                <item.icon className={item.tone} size={18} />
              </div>
              <div className="mt-3 text-3xl font-semibold text-newsroom-ink">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-md border border-newsroom-line bg-white p-4 shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="relative min-w-[300px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-newsroom-muted" size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title or location"
                className="h-10 w-full rounded-md border border-newsroom-line pl-10 pr-3 text-sm outline-none focus:border-newsroom-blue"
              />
            </div>
            <Filter size={18} className="text-newsroom-muted" />
            <input
              type="date"
              value={filters.date}
              onChange={(event) => setFilters((prev) => ({ ...prev, date: event.target.value }))}
              className="h-10 rounded-md border border-newsroom-line px-3 text-sm"
            />
            <select value={filters.location} onChange={(event) => setFilters((prev) => ({ ...prev, location: event.target.value }))} className="h-10 rounded-md border border-newsroom-line px-3 text-sm">
              <option value="">All locations</option>
              {LOCATIONS.map((location) => <option key={location}>{location}</option>)}
            </select>
            <select value={filters.category} onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))} className="h-10 rounded-md border border-newsroom-line px-3 text-sm">
              <option value="">All categories</option>
              <option value="Cuaca">Cuaca</option>
            </select>
            <select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))} className="h-10 rounded-md border border-newsroom-line px-3 text-sm">
              <option value="">All statuses</option>
              {ARTICLE_STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
            <select value={filters.runType} onChange={(event) => setFilters((prev) => ({ ...prev, runType: event.target.value }))} className="h-10 rounded-md border border-newsroom-line px-3 text-sm">
              <option value="">All run types</option>
              <option>Scheduled</option>
              <option>Manual</option>
            </select>
            <select value={filters.editor} onChange={(event) => setFilters((prev) => ({ ...prev, editor: event.target.value }))} className="h-10 rounded-md border border-newsroom-line px-3 text-sm">
              <option value="">All editors</option>
              {EDITORS.map((editor) => <option key={editor}>{editor}</option>)}
            </select>
          </div>
          {message ? <div className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">{message}</div> : null}
        </div>

        <div className="mt-5 overflow-hidden rounded-md border border-newsroom-line bg-white shadow-subtle">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-newsroom-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Article Title</th>
                <th className="px-4 py-3">Run Type</th>
                <th className="px-4 py-3">Triggered By</th>
                <th className="px-4 py-3">Generated At</th>
                <th className="px-4 py-3">Publish Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Editor</th>
                <th className="px-4 py-3">Draft</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-newsroom-line">
              {loading ? (
                <tr><td colSpan={12} className="px-4 py-10 text-center text-newsroom-muted">Loading articles...</td></tr>
              ) : articles.length ? (
                articles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(article.date)}</td>
                    <td className="px-4 py-3 font-medium">{article.location}</td>
                    <td className="px-4 py-3">{article.category}</td>
                    <td className="max-w-[280px] px-4 py-3">
                      <button className="text-left font-medium text-newsroom-blue hover:underline" onClick={() => setSelected(article)}>
                        {article.title}
                      </button>
                    </td>
                    <td className="px-4 py-3">{article.runType}</td>
                    <td className="px-4 py-3">{article.triggeredBy}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(article.generationTime)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(article.requestedPublishDatetime)}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClass(article.status)}`}>{article.status}</span></td>
                    <td className="px-4 py-3">{article.editorName ?? "-"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(article)} className="inline-flex h-8 items-center gap-1 rounded-md border border-newsroom-line px-2 text-xs font-medium hover:bg-slate-50">
                        <FileText size={14} />
                        View
                      </button>
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-newsroom-muted">{article.notes ?? "-"}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={12} className="px-4 py-10 text-center text-newsroom-muted">No articles found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {runOpen ? <RunArticleModal onClose={() => setRunOpen(false)} onCreated={loadArticles} /> : null}
      {selected ? (
        <ArticleDetailPanel
          article={selected}
          saving={saving}
          onClose={() => setSelected(null)}
          onUpdate={updateSelected}
        />
      ) : null}
    </main>
  );
}

function RunArticleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => Promise<void> }) {
  const [form, setForm] = useState({
    category: "Cuaca",
    location: "Jakarta",
    dataSource: "BMKG",
    intendedPublishDate: today(),
    intendedPublishTime: currentTime(),
    templatePreference: "Auto",
    assignedEditor: "Editor Piket",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/articles/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, triggeredBy: "Editor Piket" })
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
      <form onSubmit={submit} className="w-full max-w-2xl rounded-md bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-newsroom-line px-5 py-4">
          <h2 className="text-lg font-semibold">Run Article</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-4 px-5 py-5">
          <Field label="Category">
            <input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="h-10 w-full rounded-md border border-newsroom-line px-3" />
          </Field>
          <Field label="Location">
            <select required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="h-10 w-full rounded-md border border-newsroom-line px-3">
              {LOCATIONS.map((location) => <option key={location}>{location}</option>)}
            </select>
          </Field>
          <Field label="Data Source">
            <select required value={form.dataSource} onChange={(event) => setForm({ ...form, dataSource: event.target.value })} className="h-10 w-full rounded-md border border-newsroom-line px-3">
              <option>BMKG</option>
            </select>
          </Field>
          <Field label="Template Preference">
            <select value={form.templatePreference} onChange={(event) => setForm({ ...form, templatePreference: event.target.value })} className="h-10 w-full rounded-md border border-newsroom-line px-3">
              {TEMPLATE_PREFERENCES.map((template) => <option key={template}>{template}</option>)}
            </select>
          </Field>
          <Field label="Intended Publish Date">
            <input required type="date" value={form.intendedPublishDate} onChange={(event) => setForm({ ...form, intendedPublishDate: event.target.value })} className="h-10 w-full rounded-md border border-newsroom-line px-3" />
          </Field>
          <Field label="Intended Publish Time">
            <input required type="time" value={form.intendedPublishTime} onChange={(event) => setForm({ ...form, intendedPublishTime: event.target.value })} className="h-10 w-full rounded-md border border-newsroom-line px-3" />
          </Field>
          <Field label="Assigned Editor">
            <select value={form.assignedEditor} onChange={(event) => setForm({ ...form, assignedEditor: event.target.value })} className="h-10 w-full rounded-md border border-newsroom-line px-3">
              {EDITORS.map((editor) => <option key={editor}>{editor}</option>)}
            </select>
          </Field>
          <Field label="Notes">
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="min-h-20 w-full rounded-md border border-newsroom-line px-3 py-2" />
          </Field>
        </div>
        {error ? <div className="mx-5 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
        <div className="flex justify-end gap-2 border-t border-newsroom-line px-5 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-newsroom-line px-4 text-sm font-medium">Cancel</button>
          <button disabled={submitting} className="inline-flex h-10 items-center gap-2 rounded-md bg-newsroom-red px-4 text-sm font-semibold text-white">
            <Send size={16} />
            Generate Draft
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-newsroom-ink">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function ArticleDetailPanel({
  article,
  saving,
  onClose,
  onUpdate
}: {
  article: Article;
  saving: boolean;
  onClose: () => void;
  onUpdate: (input: { status?: string; notes?: string | null; editorName?: string | null }) => Promise<void>;
}) {
  const [notes, setNotes] = useState(article.notes ?? "");
  const [editor, setEditor] = useState(article.editorName ?? "");

  useEffect(() => {
    setNotes(article.notes ?? "");
    setEditor(article.editorName ?? "");
  }, [article]);

  return (
    <aside className="fixed right-0 top-0 z-30 h-full w-[620px] overflow-y-auto border-l border-newsroom-line bg-white shadow-xl">
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-newsroom-line bg-white px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold leading-6">{article.title}</h2>
          <div className="mt-2 flex items-center gap-2 text-sm text-newsroom-muted">
            <span>{article.location}</span>
            <span>{article.category}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ring-1 ${statusClass(article.status)}`}>{article.status}</span>
          </div>
        </div>
        <button onClick={onClose} className="rounded-md p-1 hover:bg-slate-100"><X size={18} /></button>
      </div>

      <div className="space-y-5 px-6 py-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Meta label="Source" value={article.sourceName} />
          <Meta label="Run Type" value={article.runType} />
          <Meta label="Triggered By" value={article.triggeredBy} />
          <Meta label="Generated At" value={formatDateTime(article.generationTime)} />
          <Meta label="Publish Time" value={formatDateTime(article.requestedPublishDatetime)} />
          <Meta label="Assigned Editor" value={article.editorName ?? "-"} />
        </div>

        <div className="flex gap-2">
          <a href={article.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-md border border-newsroom-line px-3 text-sm font-medium hover:bg-slate-50">
            <RefreshCcw size={15} />
            Open Source
          </a>
          <button className="inline-flex h-9 items-center gap-2 rounded-md border border-newsroom-line px-3 text-sm font-medium hover:bg-slate-50">
            <FileText size={15} />
            Open Draft
          </button>
        </div>

        <section>
          <h3 className="text-sm font-semibold uppercase text-newsroom-muted">Preview</h3>
          <p className="mt-2 rounded-md bg-slate-50 p-3 text-sm leading-6">{article.previewText}</p>
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase text-newsroom-muted">Generated Article Body</h3>
          <article className="mt-2 whitespace-pre-line rounded-md border border-newsroom-line p-4 text-[15px] leading-7">
            {article.bodyText}
          </article>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Field label="Assign Editor">
            <div className="flex gap-2">
              <select value={editor} onChange={(event) => setEditor(event.target.value)} className="h-10 flex-1 rounded-md border border-newsroom-line px-3">
                <option value="">Unassigned</option>
                {EDITORS.map((name) => <option key={name}>{name}</option>)}
              </select>
              <button disabled={saving} onClick={() => onUpdate({ editorName: editor || null })} className="inline-flex h-10 items-center gap-1 rounded-md border border-newsroom-line px-3 text-sm font-medium">
                <UserRound size={15} />
                Save
              </button>
            </div>
          </Field>
          <Field label="Status">
            <select value={article.status} onChange={(event) => onUpdate({ status: event.target.value })} className="h-10 w-full rounded-md border border-newsroom-line px-3">
              {ARTICLE_STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
          </Field>
        </section>

        <section>
          <Field label="Notes">
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-24 w-full rounded-md border border-newsroom-line px-3 py-2" />
          </Field>
          <button disabled={saving} onClick={() => onUpdate({ notes })} className="mt-2 inline-flex h-9 items-center gap-2 rounded-md border border-newsroom-line px-3 text-sm font-medium">
            <PenLine size={15} />
            Save Notes
          </button>
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase text-newsroom-muted">Editorial Actions</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <button disabled={saving} onClick={() => onUpdate({ status: "Approved" })} className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white"><CheckCircle2 size={15} />Approve</button>
            <button disabled={saving} onClick={() => onUpdate({ status: "Revision Needed" })} className="inline-flex h-9 items-center gap-2 rounded-md bg-amber-600 px-3 text-sm font-semibold text-white"><PenLine size={15} />Mark Revision Needed</button>
            <button disabled={saving} onClick={() => onUpdate({ status: "Rejected" })} className="inline-flex h-9 items-center gap-2 rounded-md bg-rose-700 px-3 text-sm font-semibold text-white"><XCircle size={15} />Reject</button>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase text-newsroom-muted">Activity Log</h3>
          <div className="mt-2 divide-y divide-newsroom-line rounded-md border border-newsroom-line">
            {article.activityLogs.map((log) => (
              <div key={log.id} className="px-3 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{log.action}</span>
                  <span className="text-xs text-newsroom-muted">{formatDateTime(log.createdAt)}</span>
                </div>
                <p className="mt-1 text-newsroom-muted">{log.actorName}{log.newStatus ? ` changed status to ${log.newStatus}` : ""}</p>
                {log.note ? <p className="mt-1 text-newsroom-muted">{log.note}</p> : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="text-xs uppercase text-newsroom-muted">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

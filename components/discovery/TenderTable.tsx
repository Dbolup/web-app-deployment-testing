"use client";
import { useEffect, useState, useRef } from "react";
import { BsStars } from "react-icons/bs";
import { Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import {
  fetchTenders,
  fetchAISuggestions,
  suggestionToTender,
  triggerAIReview,
  Tender,
  TenderFilters,
  getAccessToken,
} from "@/lib/api";
import TenderRow from "./TenderRow";
import Pagination from "./Pagination";

interface Props {
  filters: TenderFilters;
  onFilterChange: (patch: Partial<TenderFilters>) => void;
  onPageChange: (page: number) => void;
}

interface ReviewProgress {
  active: boolean;
  total: number;
  done: number;
  skipped: number;
  errors: number;
  finished: boolean;
}

export default function TenderTable({ filters, onFilterChange, onPageChange }: Props) {
  const [aiMode, setAiMode] = useState(false);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [reviewProgress, setReviewProgress] = useState<ReviewProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      setError("Not authenticated. Please log in.");
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    const load = aiMode
      ? fetchAISuggestions(100, 'pursue,review,skip').then((suggestions) => ({
          results: suggestions.map(suggestionToTender),
          count: suggestions.length,
        }))
      : fetchTenders(filters);

    load
      .then((data) => {
        setTenders(data.results);
        setTotalCount(data.count);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message ?? "Failed to load tenders");
        setLoading(false);
      });

    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiMode, filters]);

  useEffect(() => {
    const close = () => setOpenDropdown(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  async function startBulkReview() {
    if (tenders.length === 0) return;

    // Fetch all already-reviewed ref_ids (pursue + review + skip)
    let reviewedRefIds = new Set<string>();
    try {
      const all = await fetchAISuggestions(100, "pursue,review,skip");
      reviewedRefIds = new Set(all.map((s) => s.ref_id));
    } catch {
      // If the suggestions endpoint fails, proceed with reviewing all
    }

    const toReview = tenders.filter((t) => !reviewedRefIds.has(t.ref_id));
    const skipped = tenders.length - toReview.length;

    if (toReview.length === 0) {
      setReviewProgress({ active: false, total: 0, done: 0, skipped, errors: 0, finished: true });
      return;
    }

    setReviewProgress({ active: true, total: toReview.length, done: 0, skipped, errors: 0, finished: false });

    let done = 0;
    let errors = 0;
    const CONCURRENCY = 3;

    for (let i = 0; i < toReview.length; i += CONCURRENCY) {
      const batch = toReview.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(batch.map((t) => triggerAIReview(t.ref_id)));
      results.forEach((r) => {
        if (r.status === "rejected") errors++;
        done++;
      });
      setReviewProgress({ active: true, total: toReview.length, done, skipped, errors, finished: false });
    }

    setReviewProgress({ active: false, total: toReview.length, done, skipped, errors, finished: true });
  }

  const pageSize = filters.page_size ?? 20;
  const totalPages = Math.ceil(totalCount / pageSize);
  const start = (filters.page - 1) * pageSize + 1;
  const end = Math.min(filters.page * pageSize, totalCount);

  const emptyMessage = aiMode
    ? "No AI-reviewed tenders yet. Use the AI Review button above to analyse tenders."
    : "No tenders match your filters.";

  const reviewableTenders = !loading && !aiMode ? tenders : [];
  const unreviewedCount = reviewableTenders.filter(
    (t) => !t.score || t.score.ai_score === null || t.score.ai_score === 0
  ).length;

  return (
    <section className="flex-1 p-6 flex flex-col overflow-y-auto min-w-0">
      <div className="pb-6">
        <h2 className="text-xl font-bold text-[#151c27]">Tender Discovery</h2>
        <div className="flex justify-between items-center">
          <p className="text-slate-500">
            {loading
              ? "Loading opportunities…"
              : aiMode
              ? `${totalCount.toLocaleString()} AI-recommended tenders`
              : `${totalCount.toLocaleString()} opportunities found`}
          </p>

          <div className="flex items-center gap-3">
            {/* Bulk review button — raw mode only */}
            {!aiMode && !loading && tenders.length > 0 && !reviewProgress?.active && (
              <button
                onClick={startBulkReview}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border border-[#006b5f] text-[#006b5f] hover:bg-[#006b5f]/5 transition-colors"
              >
                <BsStars className="h-3.5 w-3.5" />
                Run AI Reviews
              </button>
            )}
            {reviewProgress?.active && (
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Reviewing {reviewProgress.done}/{reviewProgress.total}…
              </span>
            )}

            <div className="bg-slate-200 py-2 pl-4 pr-2 flex items-center gap-4 w-fit rounded-lg">
              <button
                onClick={() => setAiMode(false)}
                className={`text-sm font-semibold transition-colors ${
                  !aiMode ? "text-[#00236f]" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Raw Results
              </button>
              <button
                onClick={() => setAiMode(true)}
                className={`px-5 py-2 text-xs font-bold rounded-md shadow-sm flex items-center gap-2 transition-colors ${
                  aiMode
                    ? "bg-[#00236f] text-white"
                    : "bg-white text-[#00236f] hover:bg-slate-50"
                }`}
              >
                <BsStars className="h-4 w-4" />
                AI Filtered
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Review progress banner ───────────────────────────────────────────── */}
      {reviewProgress && (
        <div
          className={`mb-4 rounded-xl border px-5 py-4 flex items-center gap-4 ${
            reviewProgress.finished && reviewProgress.errors === reviewProgress.total && reviewProgress.total > 0
              ? "border-red-200 bg-red-50"
              : reviewProgress.finished
              ? "border-[#006b5f]/30 bg-[#f0fdf4]"
              : "border-[#00236f]/20 bg-[#edf2ff]"
          }`}
        >
          {/* Icon */}
          <div className="shrink-0">
            {reviewProgress.active ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#00236f]" />
            ) : reviewProgress.errors > 0 && reviewProgress.done - reviewProgress.errors === 0 ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-[#006b5f]" />
            )}
          </div>

          {/* Text + bar */}
          <div className="flex-1 min-w-0">
            {reviewProgress.active ? (
              <>
                <p className="text-sm font-semibold text-[#00236f]">
                  Analysing tenders with AI…
                </p>
                <div className="mt-2 h-1.5 bg-[#00236f]/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00236f] rounded-full transition-all duration-300"
                    style={{
                      width: reviewProgress.total > 0
                        ? `${(reviewProgress.done / reviewProgress.total) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {reviewProgress.done} of {reviewProgress.total} reviewed
                  {reviewProgress.skipped > 0 && ` · ${reviewProgress.skipped} already done`}
                  {reviewProgress.errors > 0 && ` · ${reviewProgress.errors} errors`}
                </p>
              </>
            ) : reviewProgress.total === 0 ? (
              <p className="text-sm font-semibold text-[#006b5f]">
                All {reviewProgress.skipped} tenders on this page have already been reviewed.
              </p>
            ) : (
              <p className="text-sm font-semibold text-[#006b5f]">
                Done —{" "}
                {reviewProgress.done - reviewProgress.errors} reviewed successfully
                {reviewProgress.skipped > 0 && `, ${reviewProgress.skipped} already had reviews`}
                {reviewProgress.errors > 0 && `, ${reviewProgress.errors} failed`}.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {reviewProgress.finished && reviewProgress.done - reviewProgress.errors > 0 && (
              <button
                onClick={() => { setAiMode(true); setReviewProgress(null); }}
                className="text-xs font-bold text-[#00236f] hover:underline flex items-center gap-1"
              >
                <BsStars className="h-3.5 w-3.5" />
                View AI Results
              </button>
            )}
            {reviewProgress.finished && (
              <button
                onClick={() => setReviewProgress(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden flex flex-col h-full">
        {error ? (
          <div className="flex-1 flex items-center justify-center p-12 text-red-500 text-sm">
            {error}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-sm text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Organisation</th>
                    <th className="px-6 py-4">Budget</th>
                    <th className="px-6 py-4">Deadline</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">{aiMode ? "Recommendation" : "Status"}</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-t animate-pulse">
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 bg-slate-100 rounded w-3/4" />
                          </td>
                        ))}
                        <td className="px-6 py-4" />
                      </tr>
                    ))
                  ) : tenders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-sm">
                        {emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    tenders.map((tender, i) => (
                      <TenderRow
                        key={tender.ref_id}
                        tender={tender}
                        isOpen={openDropdown === i}
                        openAction={() => setOpenDropdown(openDropdown === i ? null : i)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!aiMode && (
              <Pagination
                page={filters.page}
                totalCount={totalCount}
                pageSize={pageSize}
                totalPages={totalPages}
                start={start}
                end={end}
                onPageChange={onPageChange}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}

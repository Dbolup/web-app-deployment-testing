"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Share2,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
} from "lucide-react";
import {
  getTenderDetail,
  getAIReview,
  triggerAIReview,
  getPipelineItems,
  movePipelineItem,
  addToPipeline,
  removePipelineItem,
  TenderDetail,
  AIReviewData,
  BackendPipelineItem,
} from "@/lib/api";

const RISK_COLORS = {
  low: { text: "text-[#16a34a]", icon: <ShieldCheck className="h-8 w-8" /> },
  medium: { text: "text-[#d97706]", icon: <ShieldAlert className="h-8 w-8" /> },
  high: { text: "text-[#ef4444]", icon: <ShieldX className="h-8 w-8" /> },
};

const RECOMMENDATION_LABELS = {
  pursue: { label: "Pursue", color: "text-[#16a34a] bg-[#f0fdf4] border-[#bbf7d0]" },
  review: { label: "Review", color: "text-[#d97706] bg-[#fffbeb] border-[#fde68a]" },
  skip: { label: "Skip", color: "text-[#ef4444] bg-[#fff5f5] border-[#fecaca]" },
};

function formatBudget(t: TenderDetail): string {
  if (t.budget_display) return t.budget_display;
  if (t.budget_min !== null && t.budget_max !== null)
    return `£${(Number(t.budget_min) / 1e6).toFixed(1)}M – £${(Number(t.budget_max) / 1e6).toFixed(1)}M`;
  if (t.budget_max !== null) return `Up to £${(Number(t.budget_max) / 1e6).toFixed(1)}M`;
  return 'TBD';
}

function formatDeadline(t: TenderDetail): string {
  if (!t.deadline) return 'No deadline set';
  const d = new Date(t.deadline);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function RiskConfirmModal({
  review,
  tenderTitle,
  onConfirm,
  onCancel,
}: {
  review: AIReviewData;
  tenderTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const missingCaps = review.capability_alignment.filter((c) => !c.met);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#fff5f5] border-b border-[#fecaca] px-6 py-5 flex items-start gap-4">
          <div className="shrink-0 mt-0.5">
            <ShieldX className="h-7 w-7 text-[#ef4444]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#ef4444] mb-1">
              High Risk — AI Warning
            </p>
            <h2 className="text-lg font-bold text-[#151c27] leading-snug">
              {tenderTitle}
            </h2>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Risk badges */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]">
              <ShieldX className="h-3.5 w-3.5" /> High Risk
            </span>
            {review.recommendation === 'skip' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]">
                AI Recommendation: Skip
              </span>
            )}
            {review.ai_score !== null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                AI Score: {review.ai_score}%
              </span>
            )}
          </div>

          {/* Rationale */}
          {review.rationale && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                AI Rationale
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">{review.rationale}</p>
            </div>
          )}

          {/* Missing capabilities */}
          {missingCaps.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Unmet Requirements ({missingCaps.length})
              </p>
              <ul className="space-y-1.5">
                {missingCaps.map((cap, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#b91c1c]">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {cap.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Executive summary */}
          {review.executive_summary && (
            <div className="rounded-xl border border-[#fecaca] bg-[#fff5f5] p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#ef4444] mb-2">
                Executive Summary
              </p>
              <p className="text-sm italic text-slate-600 leading-relaxed">
                &ldquo;{review.executive_summary}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] transition-colors"
          >
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TenderAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const refId = params?.refId as string;
  const fromDiscovery = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('from') === 'discovery';

  const [tender, setTender] = useState<TenderDetail | null>(null);
  const [review, setReview] = useState<AIReviewData | null>(null);
  const [pipelineItem, setPipelineItem] = useState<BackendPipelineItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [pendingViable, setPendingViable] = useState(false);

  useEffect(() => {
    if (!refId) return;
    Promise.all([
      getTenderDetail(refId),
      getAIReview(refId),
      getPipelineItems(),
    ])
      .then(([t, r, items]) => {
        setTender(t);
        setReview(r);
        const found = items.find((i) => i.tender.ref_id === refId) ?? null;
        setPipelineItem(found);
      })
      .catch((err) => setError(err.message ?? 'Failed to load tender'))
      .finally(() => setLoading(false));
  }, [refId]);

  async function handleRunReview() {
    if (!tender) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const r = await triggerAIReview(refId);
      setReview(r);
    } catch (err: any) {
      setReviewError(err.message ?? 'AI review failed');
    } finally {
      setReviewLoading(false);
    }
  }

  async function commitAction(stage: string, label: string) {
    if (!tender) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      if (pipelineItem) {
        const updated = await movePipelineItem(pipelineItem.id, stage);
        setPipelineItem(updated);
      } else {
        const added = await addToPipeline(tender.id, stage);
        setPipelineItem(added);
      }
      setActionMsg(`Marked as ${label}`);
    } catch (err: any) {
      setActionMsg(err.message ?? 'Action failed');
    } finally {
      setActionLoading(false);
    }
  }

  function handleAction(stage: string, label: string) {
    if (stage === 'viable' && review?.risk_level === 'high') {
      setPendingViable(true);
      return;
    }
    commitAction(stage, label);
  }

  async function handleDiscard() {
    if (!pipelineItem) { router.push('/pipeline'); return; }
    setActionLoading(true);
    try {
      await removePipelineItem(pipelineItem.id);
      router.push('/pipeline');
    } catch {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-[#00236f]" />
      </main>
    );
  }

  if (error || !tender) {
    return (
      <main className="flex-1 p-10 text-red-500">
        {error ?? 'Tender not found'}
      </main>
    );
  }

  const riskStyle = review?.risk_level ? RISK_COLORS[review.risk_level] : null;
  const recStyle = review?.recommendation ? RECOMMENDATION_LABELS[review.recommendation] : null;

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {pendingViable && review && tender && (
        <RiskConfirmModal
          review={review}
          tenderTitle={tender.title}
          onConfirm={() => { setPendingViable(false); commitAction('viable', 'Viable'); }}
          onCancel={() => setPendingViable(false)}
        />
      )}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-wide font-bold text-[#a1a9b8]">
          {fromDiscovery ? (
            <a href="/discovery" className="hover:text-[#00236f]">Discovery</a>
          ) : (
            <a href="/pipeline" className="hover:text-[#00236f]">Pipeline</a>
          )}
          <span>/</span>
          <span>{tender.ref_id}</span>
        </div>

        {/* Grid */}
        <div className="mt-6 grid grid-cols-12 gap-6">
          {/* Left Card */}
          <section className="col-span-8 bg-white rounded-3xl border border-[#e5e7eb] overflow-hidden shadow-sm">
            {/* Top */}
            <div className="p-8 border-b border-[#eef1f6]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 shadow-md text-sm font-bold">
                    {tender.notice_type || 'Tender'}
                  </div>

                  <h1 className="mt-6 text-4xl leading-[1.1] font-black text-[#173b8f] max-w-[700px] capitalize">
                    {tender.title}
                  </h1>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span><b>Organisation:</b> {tender.organization}</span>
                    {tender.department && <span><b>Department:</b> {tender.department}</span>}
                    <span><b>Budget:</b> {formatBudget(tender)}</span>
                    <span><b>Deadline:</b> {formatDeadline(tender)}</span>
                    {tender.location && <span><b>Location:</b> {tender.location}</span>}
                  </div>

                  {tender.description && (
                    <div className="mt-6 max-w-[700px] space-y-4">
                      {tender.description.split('\n\n').map((para, i) => (
                        <p key={i} className="text-[18px] leading-[1.8] text-slate-500 whitespace-pre-line">
                          {para}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-5 text-slate-400">
                  {tender.source_url && (
                    <a
                      href={tender.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-slate-50 rounded transition-colors"
                    >
                      <Share2 className="h-6 w-6" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 space-y-8">
              {tender.scope && (
                <div>
                  <h2 className="text-xl font-bold text-[#173b8f] mb-3">Project Scope</h2>
                  <p className="text-[16px] leading-[1.8] text-slate-600">{tender.scope}</p>
                </div>
              )}

              {Array.isArray(tender.deliverables) && tender.deliverables.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-[#173b8f] mb-3">Deliverables</h2>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    {tender.deliverables.map((d, i) => (
                      <li key={i}>{String(d)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!tender.scope && !tender.description && (
                <p className="text-slate-400 text-sm italic">
                  No detailed description available.{' '}
                  {tender.source_url && (
                    <a
                      href={tender.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00236f] underline not-italic font-medium"
                    >
                      View full notice on Find a Tender →
                    </a>
                  )}
                </p>
              )}
            </div>
          </section>

          {/* Right Sidebar — AI Analysis */}
          <aside className="col-span-4 bg-white rounded-3xl border border-[#e5e7eb] overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 border-b border-[#eef1f6]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 bg-[#71f8e4]/20 border border-[#71f8e4] px-4 py-2 rounded-full text-[#006f64] text-sm font-bold">
                  ✦ AI Intelligence Layer
                </div>
                {review && (
                  <span className="text-sm font-medium text-slate-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <h2 className="mt-6 text-[38px] font-black text-[#173b8f]">Tender Analysis</h2>
            </div>

            {/* Review state */}
            {!review && !reviewLoading && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
                <p className="text-slate-500 text-sm text-center">
                  No AI review yet for this tender.
                </p>
                {reviewError && (
                  <p className="text-red-500 text-sm text-center">{reviewError}</p>
                )}
                <button
                  onClick={handleRunReview}
                  className="px-6 py-3 bg-[#00236f] text-white font-bold rounded-xl text-sm hover:bg-[#1e3a8a] transition-colors"
                >
                  Run AI Review
                </button>
              </div>
            )}

            {reviewLoading && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#00236f]" />
                <p className="text-slate-500 text-sm">Analysing with AI…</p>
              </div>
            )}

            {review && !reviewLoading && (
              <>
                {/* Scores */}
                <div className="grid grid-cols-2 gap-4 p-6">
                  <div className="border border-[#e5e7eb] rounded-2xl p-5">
                    <p className="text-sm font-bold text-slate-400">AI Score</p>
                    <div className="mt-4 flex items-center gap-4">
                      <span className="text-[42px] font-black text-[#006f64]">
                        {review.ai_score ?? '—'}
                      </span>
                      {review.ai_score !== null && (
                        <div className="flex-1 h-3 rounded-full bg-[#dff7f3] overflow-hidden">
                          <div
                            className="h-full bg-[#006f64] rounded-full"
                            style={{ width: `${review.ai_score}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border border-[#e5e7eb] rounded-2xl p-5">
                    <p className="text-sm font-bold text-slate-400">Risk Level</p>
                    <div className={`mt-4 flex items-center gap-3 ${riskStyle?.text ?? 'text-slate-400'}`}>
                      <span className="text-[32px] font-black capitalize">
                        {review.risk_level ?? '—'}
                      </span>
                      {riskStyle?.icon}
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                {recStyle && (
                  <div className="px-6 pb-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold border ${recStyle.color}`}>
                      Recommendation: {recStyle.label}
                    </span>
                  </div>
                )}

                {/* Capability alignment */}
                {review.capability_alignment.length > 0 && (
                  <div className="px-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-[#173b8f]">Capability Alignment</h3>
                      <span className="text-sm font-semibold text-slate-400">
                        {review.capability_alignment.filter((c) => c.met).length} of {review.capability_alignment.length} met
                      </span>
                    </div>
                    <div className="space-y-3">
                      {review.capability_alignment.map((cap, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between rounded-2xl p-4 border ${cap.met ? 'border-[#e5e7eb]' : 'border-[#fecaca] bg-[#fff5f5]'}`}
                        >
                          <div className="flex items-center gap-3">
                            {cap.met
                              ? <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                              : <AlertCircle className="h-5 w-5 text-[#ef4444]" />}
                            <span className={`text-sm font-semibold ${cap.met ? 'text-slate-700' : 'text-[#b91c1c]'}`}>
                              {cap.label}
                            </span>
                          </div>
                          <span className={`text-xs uppercase font-bold ${cap.met ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                            {cap.met ? 'Met' : 'Missing'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Executive summary */}
                {review.executive_summary && (
                  <div className="p-6">
                    <div className="rounded-2xl border border-[#dce4ff] bg-[#edf2ff] p-6">
                      <h4 className="text-xl font-bold text-[#173b8f] mb-3">Executive Summary</h4>
                      <p className="italic text-[16px] leading-[1.8] text-[#4f5d95]">
                        &ldquo;{review.executive_summary}&rdquo;
                      </p>
                    </div>
                  </div>
                )}

                {/* Re-run button */}
                <div className="px-6 pb-2">
                  <button
                    onClick={handleRunReview}
                    className="text-sm text-slate-400 hover:text-[#00236f] underline"
                  >
                    Re-run AI review
                  </button>
                </div>
              </>
            )}

            {/* Action buttons */}
            <div className="mt-auto p-6 space-y-4 border-t border-[#eef1f6]">
              {actionMsg && (
                <p className="text-sm text-center text-[#006b5f] font-semibold">{actionMsg}</p>
              )}
              <button
                disabled={actionLoading}
                onClick={() => handleAction('viable', 'Viable')}
                className="w-full h-14 rounded-xl bg-[#233f97] text-white font-bold text-lg shadow-lg shadow-blue-900/20 hover:bg-[#173b8f] transition-colors disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Mark as Viable'}
              </button>
              <div className="grid grid-cols-2 gap-4">
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction('under_review', 'Under Review')}
                  className="h-14 rounded-xl border border-[#dce2f3] text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-60"
                >
                  Send for Review
                </button>
                <button
                  disabled={actionLoading}
                  onClick={handleDiscard}
                  className="h-14 rounded-xl border border-[#fecaca] text-[#ef4444] font-semibold hover:bg-[#fff5f5] transition-colors disabled:opacity-60"
                >
                  Discard
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

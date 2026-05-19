// app/documents/page.tsx
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { BiCloudUpload } from "react-icons/bi";
import { BsBoxSeam, BsFilterLeft, BsStars } from "react-icons/bs";
import { MdOutlineFactCheck, MdOutlinePictureAsPdf } from "react-icons/md";
import { FaFileWord } from "react-icons/fa";
import { FaFileAlt } from "react-icons/fa";
import { IoIosClose } from "react-icons/io";
import { RiTimeLine, RiTimelineView } from "react-icons/ri";
import { Loader2, Trash2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { ExtractedSectionCard } from "../../components/documents/ExtratedSectionCard";
import {
  listDocuments, uploadDocument, processDocument, getDocument, deleteDocument,
  Doc, ExtractedSection,
} from "@/lib/api";

function getFileIcon(fileName?: string) {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <MdOutlinePictureAsPdf className="text-red-600" size={20} />;
  if (ext === "doc" || ext === "docx") return <FaFileWord className="text-blue-600" size={20} />;
  return <FaFileAlt className="text-slate-500" size={20} />;
}

function StatusBadge({ status }: { status: Doc["status"] }) {
  const map = {
    uploaded: { icon: <Clock size={12} />, label: "Queued", cls: "text-amber-600 bg-amber-50 border-amber-200" },
    processing: { icon: <Loader2 size={12} className="animate-spin" />, label: "Processing", cls: "text-blue-600 bg-blue-50 border-blue-200" },
    processed: { icon: <CheckCircle2 size={12} />, label: "Processed", cls: "text-[#006b5f] bg-[#006b5f]/10 border-[#006b5f]/20" },
    failed: { icon: <AlertCircle size={12} />, label: "Failed", cls: "text-red-600 bg-red-50 border-red-200" },
  };
  const { icon, label, cls } = map[status] ?? map.uploaded;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-full border ${cls}`}>
      {icon}{label}
    </span>
  );
}

// ─── Section content renderers ────────────────────────────────────────────────

function renderSectionContent(section: ExtractedSection) {
  const { section_type, content } = section;

  if (section_type === "deliverables" || section_type === "requirements") {
    const items = Array.isArray(content)
      ? content as string[]
      : typeof content === "object" && content !== null && "items" in (content as Record<string, unknown>)
        ? ((content as Record<string, unknown>).items as string[])
        : [String(content)];
    return (
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 capitalize text-[#444651]">
            <span className="w-1.5 h-1.5 bg-[#00236f] rounded-full shrink-0" />
            {String(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (section_type === "evaluation_criteria") {
    const criteria: Record<string, string> =
      typeof content === "object" && content !== null && !Array.isArray(content)
        ? (content as Record<string, string>)
        : {};
    const entries = Object.entries(criteria);
    if (entries.length === 0) {
      return <p className="text-[#444651]">{String(content)}</p>;
    }
    return (
      <div className="flex flex-col gap-2">
        {entries.map(([key, val]) => {
          const pct = parseInt(String(val));
          return (
            <div key={key}>
              <div className="flex justify-between items-center">
                <span className="text-[#757682] capitalize text-sm">{key.replace(/_/g, " ")}</span>
                <span className="text-[#00236f] font-bold text-sm">{val}</span>
              </div>
              {!isNaN(pct) && (
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-[#1e3a8a] h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (section_type === "timeline") {
    const obj = typeof content === "object" && content !== null && !Array.isArray(content)
      ? (content as Record<string, string>)
      : {};
    const entries = Object.entries(obj);
    if (entries.length === 0) return <p className="text-[#444651]">{String(content)}</p>;
    return (
      <div className="flex flex-col gap-2">
        {entries.map(([key, val], i) => (
          <div key={key} className="flex gap-2">
            <div className="flex flex-col items-center">
              <div className={`rounded-full h-2 w-2 mt-1 ${i === 0 ? "bg-[#00236f]" : "bg-slate-300"}`} />
              {i < entries.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-1" />}
            </div>
            <div>
              <p className="text-[#757682] uppercase font-bold text-[10px]">{key.replace(/_/g, " ")}</p>
              <p className="text-[#00236f] font-bold text-sm">{val}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // scope_of_work / other: plain text
  return <p className="text-[#444651]">{typeof content === "string" ? content : JSON.stringify(content)}</p>;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  scope_of_work: <RiTimelineView />,
  deliverables: <BsBoxSeam />,
  evaluation_criteria: <MdOutlineFactCheck />,
  timeline: <RiTimeLine />,
  requirements: <BsBoxSeam />,
  other: <FaFileAlt />,
};

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function DocumentProcessingPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const [busyPhase, setBusyPhase] = useState<"idle" | "uploading" | "analyzing">("idle");
  const [uploadError, setUploadError] = useState("");
  const [loadingDocs, setLoadingDocs] = useState(true);
  const pollCountRef = useRef(0);

  // ── Load existing documents ──────────────────────────────────────────────
  useEffect(() => {
    listDocuments()
      .then(docs => {
        setDocuments(docs);
        // If any doc was left processing, resume polling it
        const inFlight = docs.find(d => d.status === "processing");
        if (inFlight) setActiveDoc(inFlight);
      })
      .catch(() => {})
      .finally(() => setLoadingDocs(false));
  }, []);

  // ── Poll active document while processing ────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const MAX_POLLS = 60; // 3 min timeout for async queue backends

  useEffect(() => {
    if (!activeDoc || activeDoc.status !== "processing") { stopPolling(); return; }

    pollCountRef.current = 0;
    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      if (pollCountRef.current > MAX_POLLS) {
        stopPolling();
        setActiveDoc(prev => prev ? { ...prev, status: "failed" } : prev);
        return;
      }
      try {
        const updated = await getDocument(activeDoc.id);
        setActiveDoc(updated);
        setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d));
        if (updated.status !== "processing") stopPolling();
      } catch { stopPolling(); }
    }, 3000);

    return stopPolling;
  }, [activeDoc?.id, activeDoc?.status, stopPolling]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); setUploadError(""); }
  };

  async function handleStartAnalysis() {
    if (!selectedFile) return;
    setUploadError("");
    try {
      setBusyPhase("uploading");
      const doc = await uploadDocument(selectedFile);
      setBusyPhase("analyzing");
      // With ImmediateBackend this call blocks until Claude finishes (~20s)
      // and returns status:"processed" with sections already populated.
      const result = await processDocument(doc.id);
      setDocuments(prev => [result, ...prev]);
      setActiveDoc(result);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusyPhase("idle");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (activeDoc?.id === id) setActiveDoc(null);
    } catch { /* ignore */ }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const sections = activeDoc?.sections ?? [];
  const analysisComplete = activeDoc?.status === "processed" && sections.length > 0;

  return (
    <div className="py-6 px-6 space-y-10 font-sans">
      <header>
        <h1 className="text-2xl font-bold text-[#00236f]">Document Processing</h1>
        <p className="text-[#757682] text-sm mt-1 font-medium">
          Upload and analyze tender documents using our proprietary AI extraction engine.
        </p>
      </header>

      {/* Hero Interaction Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dropzone */}
        <div
          className="lg:col-span-2 border-2 border-dashed border-slate-200 rounded-2xl bg-white p-12 flex flex-col items-center justify-center text-center transition-colors hover:border-blue-300"
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) { setSelectedFile(file); setUploadError(""); }
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            className="hidden"
          />
          <div className="bg-blue-50 p-4 rounded-lg mb-5">
            <BiCloudUpload className="text-[#1E3A8A] text-3xl" size={32} />
          </div>
          <h2 className="text-lg font-bold text-[#151c27]">
            {selectedFile ? selectedFile.name : "Upload Tender Documents (Word, PDF)"}
          </h2>
          <p className="text-sm text-[#757682] mt-2 max-w-sm font-medium">
            {selectedFile
              ? `Size: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
              : "Drag and drop your request for proposals or technical specifications here to begin AI-powered extraction."}
          </p>
          {uploadError && (
            <p className="text-sm text-red-600 mt-3 font-medium">{uploadError}</p>
          )}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-2 border border-[#757682] rounded text-sm text-[#00236f] hover:bg-[#f0f3ff] transition-colors shadow-sm"
            >
              {selectedFile ? "Change File" : "Select Files from Computer"}
            </button>
            {selectedFile && (
              <button
                onClick={handleStartAnalysis}
                disabled={busyPhase !== "idle"}
                className="px-8 py-2.5 bg-[#00236f] text-white rounded-lg text-sm font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center gap-2"
              >
                {busyPhase !== "idle" && <Loader2 size={14} className="animate-spin" />}
                {busyPhase === "uploading" ? "Uploading…" : busyPhase === "analyzing" ? "Analyzing…" : "Start Analysis"}
              </button>
            )}
          </div>
        </div>

        {/* Active Processing Panel */}
        <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#151c27]">
              Active Processing
            </h3>
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#006b5f] bg-[#006b5f]/10 px-2.5 py-1 rounded-full border border-[#006b5f]/20">
              <BsStars className="h-3.5 w-3.5" /> AI ENGINE ACTIVE
            </span>
          </div>

          {activeDoc ? (
            <div className="bg-[#f0f3ff] p-4 rounded-lg border border-slate-100 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-white p-2 rounded border border-slate-200 shrink-0">
                  {getFileIcon(activeDoc.filename)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-900 truncate">{activeDoc.filename}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{activeDoc.file_size_display}</p>
                  <div className="mt-1.5">
                    <StatusBadge status={activeDoc.status} />
                  </div>
                </div>
                <button
                  onClick={() => setActiveDoc(null)}
                  className="text-slate-400 hover:text-slate-600 shrink-0"
                >
                  <IoIosClose className="h-4 w-4" />
                </button>
              </div>

              {activeDoc.status === "processing" && (
                <>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1e3a8a] h-full rounded-full transition-all duration-500 relative"
                      style={{ width: `${Math.max(activeDoc.processing_progress, 5)}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 text-center">
                    {activeDoc.processing_progress > 0 ? `${activeDoc.processing_progress}% complete` : "Processing…"}
                  </p>
                </>
              )}
              {activeDoc.status === "processed" && (
                <p className="text-xs text-[#006b5f] font-semibold text-center">
                  ✓ Extraction complete — {sections.length} sections found
                </p>
              )}
              {activeDoc.status === "failed" && (
                <p className="text-xs text-red-600 font-semibold text-center">
                  Processing failed. Please try again.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-[#f0f3ff] p-6 rounded-lg border border-slate-100 flex flex-col items-center justify-center gap-2 min-h-[120px]">
              <BiCloudUpload className="text-slate-300" size={32} />
              <p className="text-sm text-slate-400 text-center">Upload a document to begin AI processing</p>
            </div>
          )}

          <p className="text-[11px] text-slate-400 italic mt-4">
            Analysis usually takes 30–45 seconds for high-density PDF files.
          </p>
        </div>
      </div>

      {/* Document Library */}
      {(documents.length > 0 || loadingDocs) && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-[#00236f] border-b border-slate-100 pb-3">
            Document Library
          </h2>
          {loadingDocs ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setActiveDoc(doc)}
                  className={`flex items-center gap-4 px-5 py-3 rounded-xl border cursor-pointer transition-colors ${
                    activeDoc?.id === doc.id
                      ? "border-[#00236f]/40 bg-[#e7eefe]"
                      : "border-slate-200 bg-white hover:border-[#00236f]/30 hover:bg-slate-50"
                  }`}
                >
                  <div className="shrink-0">{getFileIcon(doc.filename)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#00236f] truncate">{doc.filename}</p>
                    <p className="text-xs text-slate-400">{doc.file_size_display} · {new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={doc.status} />
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(doc.id); }}
                    className="text-slate-300 hover:text-red-500 transition-colors shrink-0 ml-2"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Extracted Sections */}
      {analysisComplete && (
        <section className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-[#00236f]">
              Extracted Sections Preview
            </h2>
            <div className="flex items-center gap-2">
              <button className="text-[12px] font-bold text-[#757682] flex items-center gap-1 hover:text-[#00236f] transition-colors">
                <BsFilterLeft className="text-sm" />
                Filter by relevance
              </button>
              <div className="h-4 w-px bg-slate-300" />
              <button className="bg-[#00236f] text-white px-6 py-1.5 text-sm font-bold shadow-lg shadow-blue-900/20 hover:opacity-90 transition-colors">
                Export to Draft
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {sections.map((section, i) => (
              <div
                key={section.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <ExtractedSectionCard
                  icon={SECTION_ICONS[section.section_type] ?? <FaFileAlt />}
                  title={section.title}
                  status={
                    section.ai_verified
                      ? "Verified by AI"
                      : `${Math.round(section.accuracy_score * 100)}% accuracy`
                  }
                >
                  {renderSectionContent(section)}
                </ExtractedSectionCard>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Processing — sections not yet available */}
      {activeDoc?.status === "processing" && (
        <section className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
          <Loader2 size={40} className="animate-spin text-[#00236f]" />
          <p className="text-lg font-semibold text-[#00236f]">AI is processing your document…</p>
          <p className="text-sm text-slate-400">Extracted sections will appear here automatically.</p>
        </section>
      )}

      {/* Statistics Footer */}
      <footer className="grid grid-cols-3 border-t border-slate-200 pt-10 text-center opacity-50 font-bold">
        <div>
          <p className="text-2xl font-bold text-blue-900">2.4k</p>
          <p className="text-[10px] font-bold uppercase text-[#151c27] tracking-[0.2em] mt-1">
            Pages Processed Today
          </p>
        </div>
        <div className="border-x border-slate-200">
          <p className="text-2xl font-bold text-blue-900">99.2%</p>
          <p className="text-[10px] font-bold uppercase text-[#151c27] tracking-[0.2em] mt-1">
            Extraction Accuracy
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-900">12s</p>
          <p className="text-[10px] font-bold uppercase text-[#151c27] tracking-[0.2em] mt-1">
            Avg Processing Speed
          </p>
        </div>
      </footer>
    </div>
  );
}

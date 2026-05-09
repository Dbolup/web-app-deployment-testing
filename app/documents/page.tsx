// app/documents/page.tsx
"use client";
import { useRef, useState } from "react";
import { ExtractedSectionCard } from "../../components/documents/ExtratedSectionCard";
import { BiCloudUpload } from "react-icons/bi";
import { BsBoxSeam, BsFilterLeft, BsStars } from "react-icons/bs";
import { MdOutlineFactCheck, MdOutlinePictureAsPdf } from "react-icons/md";
import { FaFileWord } from "react-icons/fa";
import { FaFileAlt } from "react-icons/fa";
import { IoIosClose, IoMdInformationCircleOutline } from "react-icons/io";
import { RiTimeLine, RiTimelineView } from "react-icons/ri";
import Modal from "@/components/modal";
import AnalysisPreviewModal from "@/components/documents/AnalysisPreviewModal";

export default function DocumentProcessingPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const getFileIcon = (fileName?: string) => {
    if (!fileName) return <FaFileAlt className="text-red-600" />;

    const ext = fileName.split(".").pop()?.toLowerCase();

    switch (ext) {
      case "pdf":
        return <MdOutlinePictureAsPdf className="text-red-600" />;

      case "doc":
      case "docx":
        return <FaFileWord className="text-red-600" />;

      default:
        return <FaFileAlt className="text-red-600" />;
    }
  };
  const handleButtonClick = () => {
    // Programmatically click the hidden input
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      console.log("File selected:", file.name);
      // Here you would typically trigger an upload function or update your AI processing state
    }
  };
  const extractedSectionPreviews = [
    {
      title: "Scope of Work",
      icon: <RiTimelineView />,
      status: "Verified by AI",
      content:
        "Comprehensive infrastructure development project involving the construction of 4 regional data centers...",
    },
    {
      title: "Deliverables",
      icon: <BsBoxSeam />,
      status: "4 ITEMS FOUND",
      isList: true,
      content: [
        "Site Survey Reports",
        "Phase 1 Schematic Designs",
        "Commissioning Sign-offs",
      ],
    },
    {
      title: "Evaluation Criteria",
      icon: <MdOutlineFactCheck />,
      status: "COMPLEX LOGIC",
      content:
        "Technical Merit: 40%, Proposed Cost: 35%, Past Performance: 25%.",
    },
    {
      title: "Timeline",
      icon: <RiTimeLine />,
      status: "TIGHT DEADLINES",
      content: "Submission: Oct 14, 2024. Award Date: Dec 20, 2024.",
    },
  ];
  const scopeOfWork = {
    content:
      "Comprehensive infrastructure development project involving the construction of 4 regional data centers...",
    status: "Verified by AI",
  };
  const deliverables = [
    "site survey report",
    "phase one schematic design",
    "commisioning sig-offs",
  ];
  const evaluation = {
    technicalMerit: "40%",
    proposedCost: "35%",
    status: "complex logic",
  };
  const timeline = {
    submissionDate: "oct 14, 2024",
    awardedDate: "dec 20, 2024",
    status: "TIGHT DEADLINES",
  };
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const handleAnalyzeDocument = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setAnalysisComplete(false);

    // Fake AI processing delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }, 3000);
  };
  const [openModal, setOpenModal] = useState(false);

  return (
    <div className="py-6 px-6 space-y-10 font-sans">
      <header>
        <h1 className="text-2xl font-bold text-[#00236f]">
          Document Processing
        </h1>
        <p className="text-[#757682] text-sm mt-1 font-medium">
          Upload and analyze tender documents using our proprietary AI
          extraction engine.
        </p>
      </header>
      {/* Hero Interaction Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dropzone Container */}
        <div className="lg:col-span-2 border-2 border-dashed border-slate-200 rounded-2xl bg-white p-12 flex flex-col items-center justify-center text-center transition-colors hover:border-blue-300">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            className="hidden"
          />

          <div className="bg-blue-50 p-4 rounded-lg mb-5">
            <span className="material-symbols-outlined text-[#1E3A8A] text-3xl">
              {selectedFile ? <BiCloudUpload /> : <BiCloudUpload />}
            </span>
          </div>

          <h2 className="text-lg font-bold text-[#151c27]">
            {selectedFile
              ? selectedFile.name
              : "Upload Tender Documents (Word, PDF)"}
          </h2>

          <p className="text-sm text-[#757682] mt-2 max-w-sm font-medium">
            {selectedFile
              ? `Size: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
              : "Drag and drop your request for proposals or technical specifications here to begin AI-powered extraction."}
          </p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleButtonClick}
              className="px-8 py-2 border border-[#757682] rounded text-sm  text-[#00236f] hover:bg-[#f0f3ff] transition-colors shadow-sm"
            >
              {/* bg-white border border-outline px-lg py-sm rounded font-label-md text-primary hover:bg-surface-container-low transition-colors */}
              {selectedFile ? "Change File" : "Select Files from Computer"}
            </button>

            {selectedFile && (
              <button
                onClick={handleAnalyzeDocument}
                disabled={isAnalyzing}
                className="px-8 py-2.5 bg-[#00236f] text-white rounded-lg text-sm font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
              >
                {isAnalyzing ? "Analyzing..." : "Start Analysis"}
              </button>
            )}
          </div>
        </div>

        {/* Processing Panel */}
        <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#151c27]">
              Active Processing
            </h3>
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#006b5f] bg-[#006b5f]/10 px-2.5 py-1 rounded-full border border-[#006b5f]/20">
              <span className="material-symbols-outlined text-[12px]">
                <BsStars className="h-4 w-4 " />
              </span>{" "}
              AI ENGINE ACTIVE
            </span>
          </div>
          <div className="bg-[#f0f3ff] p-4 rounded-lg border border-slate-100 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-white p-2 rounded border border-slate-200">
                {getFileIcon(selectedFile?.name)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900 truncate">
                  {selectedFile
                    ? selectedFile.name
                    : "RFP_Infrastructure_2024.pdf"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isAnalyzing
                    ? "Processing with AI... (82%)"
                    : analysisComplete
                      ? "Analysis completed successfully"
                      : "Waiting for analysis"}
                </p>
              </div>
              <div>
                <button className="text-slate-400 hover:text-error transition-colors cursor-pointer">
                  <IoIosClose className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
              <div className="bg-[#1e3a8a] h-full rounded-full w-[82%] relative">
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2 mt-2">
              <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200"></div>
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200"></div>
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200"></div>
            </div>
          </div>
          <div className="mt-auto pt-4 flex items-center gap-2">
            <IoMdInformationCircleOutline className="h-4 w-4" />

            <p className="text-[11px] text-outline italic">
              Analysis usually takes 30-45 seconds for high-density PDF files.
            </p>
          </div>
          <div className="pt-3">
            <button
              className="px-3 py-2 bg-blue-900 text-white text-sm"
              onClick={() => setOpenModal(true)}
            >
              Preview Document
            </button>
          </div>
        </div>
      </div>
      <div className="p-10">
        {/* <Modal
          isOpen={openModal}
          onClose={() => setOpenModal(false)}
          title="Tender Details"
        >
          <div className="space-y-4">
            <p className="text-slate-600">
              This is a reusable modal component.
            </p>

            <button
              onClick={() => setOpenModal(false)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg"
            >
              Close Modal
            </button>
          </div>
        </Modal> */}
        <AnalysisPreviewModal
          isOpen={openModal}
          onClose={() => setOpenModal(false)}
        />
      </div>

      {/* Preview Section */}
      {analysisComplete && (
        <section className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-[#00236f]">
              Extracted Sections Preview
            </h2>
            <div className="flex items-center gap-2">
              <button className="text-[12px] font-bold text-[#757682] flex items-center gap-1 hover:text-[#00236f] transition-colors cursor-pointer">
                <BsFilterLeft className="text-sm" />
                Filter by relevance
              </button>
              <div className="h-4 w-px bg-slate-300"></div>

              <button className="bg-[#00236f] text-white px-6 py-1.5  text-sm font-bold shadow-lg shadow-blue-900/20 hover:opacity-90 transition-colors cursor-pointer">
                Export to Draft
              </button>
            </div>
          </div>
          {/* extracted section preview */}
          <div>
            {/* {extractedSectionPreviews.map((preview, index) => (
              <div
                key={index}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{
                  animationDelay: `${index * 200}ms`,
                }}
              >
                <ExtractedSectionCard
                  icon={preview.icon}
                  title={preview.title}
                  status={preview.status}
                  content={preview.content}
                >
                </ExtractedSectionCard>
              </div>
            ))} */}
            <div
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{
                animationDelay: ` 200ms`,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <ExtractedSectionCard
                  icon={<RiTimelineView />}
                  title="Scope of work"
                  status={scopeOfWork.status}
                >
                  <p className="text-[#444651]">{scopeOfWork.content}</p>
                </ExtractedSectionCard>
                <ExtractedSectionCard
                  icon={<BsBoxSeam />}
                  title="Deliverables"
                  status={`${deliverables.length} Items Found`}
                >
                  <ul className="space-y-2">
                    {deliverables.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 capitalize text-[#444651] "
                      >
                        <span className="w-1.5 h-1.5 bg-[#00236f] rounded-full shrink-0 " />
                        {item}
                      </li>
                    ))}
                  </ul>
                </ExtractedSectionCard>
                <ExtractedSectionCard
                  icon={<MdOutlineFactCheck />}
                  title="Evaluation Criteria"
                  status={evaluation.status}
                >
                  <div className="flex flex-col gap-1.5">
                    <div>
                      <div className="flex justify-between items-center">
                        <div className="text-[#757682]">Technical Merit</div>
                        <div className="text-[#00236f] font-bold">
                          {evaluation.technicalMerit}
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                        <div
                          className={`bg-[#1e3a8a] h-full rounded-full w-[40%] relative`}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center">
                        <div className="text-[#757682]">Proposed Cost</div>
                        <div className="text-[#00236f] font-bold">
                          {evaluation.proposedCost}
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                        <div
                          className={`bg-[#1e3a8a] h-full rounded-full w-[35%] relative`}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ExtractedSectionCard>
                <ExtractedSectionCard
                  icon={<RiTimeLine />}
                  title="Timeline"
                  status={timeline.status}
                >
                  <div className="flex flex-col gap-1.5">
                    <div>
                      <div className="flex gap-2">
                        <div className="flex flex-col">
                          <div className="rounded-full h-2 w-2 bg-[#00236f] mt-1"></div>
                          <div className="w-0.5 h-6 bg-slate-100 ml-0.5"></div>
                        </div>
                        <div className="">
                          <p className="text-[#757682] uppercase font-bold text-[10px]">
                            {" "}
                            submission
                          </p>
                          <p className="text-blue-900 font-bold text-sm">
                            {timeline.submissionDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex  items-center gap-2"></div>
                    </div>
                    <div>
                      <div className="flex   gap-2">
                        <div className="flex flex-col">
                          <div className="w-2 h-2 rounded-full bg-slate-300 mt-1"></div>
                        </div>
                        <div className="">
                          <p className="text-[#757682] uppercase font-bold text-[10px]">
                            award date
                          </p>
                          <p className="text-[#00236f] font-bold text-sm">
                            {timeline.submissionDate}
                          </p>
                        </div>
                        <div className="w-0.5 h-6 bg-slate-100"></div>
                      </div>
                      <div className="flex  items-center gap-2"></div>
                    </div>
                  </div>
                </ExtractedSectionCard>
              </div>
            </div>
          </div>
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

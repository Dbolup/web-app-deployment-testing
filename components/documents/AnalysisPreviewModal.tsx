// components/documents/AnalysisPreviewModal.tsx
"use client";

import { IoClose } from "react-icons/io5";
import { BsStars } from "react-icons/bs";
import { FaFolder } from "react-icons/fa6";
import { FiEye } from "react-icons/fi";
import { LuListTodo } from "react-icons/lu";
import { MdOutlineChecklist } from "react-icons/md";
import Tiptap from "../ui/TipTap";

interface AnalysisPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const documentSections = [
  {
    id: 1,
    title: "Tender Overview",
    active: true,
    icon: <MdOutlineChecklist className="h-4 w-4" />,
  },
  {
    id: 2,
    title: "Requirements Breakdown",
    active: false,
    icon: <LuListTodo className="h-4 w-4" />,
  },
  {
    id: 3,
    title: "Action Items & Tasks",
    active: false,
    icon: <LuListTodo className="h-4 w-4" />,
  },
  {
    id: 4,
    title: "Delivery Timeline",
    active: false,
    icon: <LuListTodo className="h-4 w-4" />,
  },
];

export default function AnalysisPreviewModal({
  isOpen,
  onClose,
}: AnalysisPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex  items-center justify-start top-16 left-[15%]">
      {/* Overlay */}
      <div className="absolute inset-0 " onClick={onClose} />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl  rounded-2xl overflow-hidden shadow-2xl border border-slate-200  bg-[#f9f9ff]"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-8 py-6 border-b border-slate-200 ">
          <div>
            <h2 className="text-4xl font-bold text-[#00236f]">
              Confluence Automation
            </h2>

            <p className="text-slate-500 mt-2 text-lg">
              Convert tender intelligence into structured documentation.
            </p>
          </div>
          <div className="flex flex-col gap-2 ">
            <div className="flex items-center gap-4 justify-end">
              <div className="flex items-center gap-2 bg-[#71f8e4]/20 border border-[#71f8e4] text-[#006f64] px-4 py-2 rounded-full text-sm font-semibold">
                <BsStars className="h-4 w-4" />
                AI Generated Structure
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <IoClose className="h-5 w-4 text-slate-700" />
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <div className="bg-blue-400 h-2 w-2 rounded-full"></div>
              <div>connected to Atlassian confluence</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-3 border-r border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#151c27]">
                Document Structure
              </h3>

              <button className="h-8 w-8 rounded-full border border-[#1e3a8a] text-[#1e3a8a] flex items-center justify-center hover:bg-[#1e3a8a] hover:text-white transition-colors">
                +
              </button>
            </div>

            <div className="space-y-4">
              {documentSections.map((section) => (
                <button
                  key={section.id}
                  className={`w-full text-left border rounded-xl p-4 transition-all ${
                    section.active
                      ? "border-[#1e3a8a] bg-[#f9f9ff]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded border flex items-center justify-center ${
                        section.active
                          ? "bg-[#1e3a8a] border-[#1e3a8a] text-white"
                          : "border-slate-300 text-slate-400"
                      }`}
                    >
                      ✓
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      {section.icon}
                      {section.title}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Destination */}
            <div className="mt-8 border border-dashed border-slate-300 rounded-xl p-4 bg-[#f9f9ff]">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">
                Destination Space
              </p>

              <div className="border border-slate-200 rounded-lg bg-white p-4 flex items-center gap-3">
                <FaFolder className="text-[#1e3a8a]" />

                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Global Operations /
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    2024-Tenders
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Preview */}
          <main className="col-span-9 flex flex-col h-[700px] overflow-hidden">
            {/* Toolbar */}
            {/* <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <FiEye className="text-slate-500" />

                <h4 className="font-semibold text-slate-700">
                  Document Preview: Tender Overview
                </h4>
              </div> */}
            {/* <div className="flex items-center gap-5 text-slate-500">
                <button className="font-bold">B</button>
                <button className="italic font-semibold">I</button>
                <button>≣</button>
                <button>{"</>"}</button>
              </div> */}
            <div className="flex-1 min-h-0 ">
              <Tiptap />
            </div>
            {/* </div> */}
            {/* Document */}
          </main>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-slate-200 bg-white z-10">
          <div className="flex items-center gap-3 text-[#006f64] font-semibold">
            <div className="h-6 w-6 rounded-full bg-[#71f8e4]/30 flex items-center justify-center">
              ✓
            </div>
            4/4 Pages Ready for Export
          </div>

          <div className="flex items-center gap-4">
            <button className="px-6 py-3 border border-[#006f64] text-[#006f64] rounded-xl font-semibold hover:bg-[#006f64]/5 transition-colors">
              Save as Draft
            </button>

            <button className="px-8 py-3 bg-[#00236f] text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20 hover:bg-[#001b57] transition-colors">
              Push to Confluence
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { FiEye } from "react-icons/fi";
import { FloatingMenu, BubbleMenu } from "@tiptap/react/menus";
import { useMemo } from "react";
import Menubar from "./Menubar";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Bold, Italic } from "lucide-react";
import { ImBold, ImItalic } from "react-icons/im";

const content = `
  <div className="flex-1 overflow-y-auto p-10">
              <div class="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-12">
                <h1 class="text-5xl font-bold text-[#151c27] leading-tight">
                  Tender Overview: Smart City Infrastructure Phase 4
                </h1>
                <div class="mt-10 border-l-4 border-[#1e3a8a] bg-[#dce1ff]/30 p-6">
                  <h3 class="text-[#1e3a8a] text-2xl font-bold">
                    Executive Summary
                  </h3>

                  <p class="mt-3 text-[#264191] leading-8 text-lg">
                    Strategic proposal for the modernization of regional
                    transport hubs using TenderFlow AI predictive modeling.
                    Priority level: <strong>High</strong>.
                  </p>
                </div>

                <section class="mt-12">
                  <h2 class="text-4xl font-bold text-[#151c27]">
                    Project Context
                  </h2>

                  <p class="mt-6 text-slate-600 text-xl leading-10">
                    The Metropolitan Authority has issued RFP-2024-089 focusing
                    on the integration of IoT sensors and automated dispatch
                    systems. Our solution leverages proprietary LLM-based
                    logistics optimization to reduce carbon emissions by an
                    estimated 14% across all hub operations.
                  </p>
                </section>

                <section class="mt-12">
                  <h2 class="text-3xl font-bold text-[#151c27]">
                    Key Objectives
                  </h2>

                  <ul class="mt-6 space-y-5 list-disc pl-8 text-slate-600 text-xl">
                    <li>Deployment of 4,200 real-time telemetry nodes.</li>

                    <li>
                      Centralized Command Center interface for 24/7 monitoring.
                    </li>

                    <li>
                      Zero-downtime migration from legacy transit databases.
                    </li>
                  </ul>
                </section>
              </div>
            </div>
`;

const Tiptap = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content,
    immediatelyRender: false,
  });

  if (!editor) return null;

  return (
    <div className="border border-slate-200 overflow-hidden flex flex-col h-full ">
      {" "}
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0 ">
        <div className="flex items-center gap-3">
          <FiEye className="text-slate-500" />

          <h4 className="font-semibold text-slate-700">
            Document Preview: Tender Overview
          </h4>
        </div>
        <div className="flex items-center gap-2 p-4 bg-white">
          {/* <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded border text-sm ${
              editor.isActive("bold") ? "text-black" : "bg-white"
            }`}
          >
            B
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded border text-sm ${
              editor.isActive("italic") ? "bg-[#1e3a8a] text-white" : "bg-white"
            }`}
          >
            Italic
          </button>

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="px-3 py-1 rounded border text-sm"
          >
            List
          </button> */}

          <Menubar editor={editor} />
        </div>
      </div>
      {/* Editor */}
      <div className="flex-1 min-h-0 overflow-hidden bg-white p-10">
        <div className="h-full overflow-y-auto">
          <EditorContent editor={editor} />
          {/* <FloatingMenu editor={editor}>This is the floating menu</FloatingMenu> */}
          <BubbleMenu editor={editor}>
            <div className="flex gap-2 px-4  py-2 rounded-sm bg-white shadow-md">
              <button onClick={() => editor.chain().focus().toggleBold().run()}>
                <ImBold size={16} />
              </button>

              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <ImItalic size={16} />
              </button>
            </div>
          </BubbleMenu>
        </div>
      </div>
    </div>
  );
};

export default Tiptap;

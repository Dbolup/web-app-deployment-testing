"use client";

import { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Link as LinkIcon,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { IoIosCodeWorking } from "react-icons/io";

import { IoCodeSlashOutline, IoCodeWorkingSharp } from "react-icons/io5";
import { LuList } from "react-icons/lu";
import { ImBold, ImItalic } from "react-icons/im";

interface MenubarProps {
  editor: Editor | null;
}

const Menubar = ({ editor }: MenubarProps) => {
  const activeClass = "bg-slate-200 shadow-md text-slate-900";

  const inactiveClass =
    "text-slate-600 hover:bg-slate-100 hover:text-slate-700";
  const buttonClass =
    "h-8 w-8 flex items-center justify-center  rounded-sm transition-colors";

  const [openToolbar, setOpenToolbar] = useState(false);

  if (!editor) return null;
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isBold: editor.isActive("bold"),
      isItalic: editor.isActive("italic"),
      isBulletList: editor.isActive("bulletList"),
    }),
  });
  return (
    <div className="relative flex flex-col w-full">
      {/* TOP TOOLBAR */}
      <div className=" flex items-center gap-4 px-4 rounded-t-xl">
        {" "}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${buttonClass} ${
            editorState.isBold ? activeClass : inactiveClass
          }`}
        >
          <ImBold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={` ${buttonClass} ${
            editor.isActive("italic") ? activeClass : inactiveClass
          }`}
        >
          <ImItalic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={` ${buttonClass} ${
            editorState.isBulletList ? activeClass : inactiveClass
          }`}
        >
          <LuList className="h-5 w-5" />
        </button>
        {/* Divider */}
        <div className="h-5 w-px bg-slate-300" />
        <button
          onClick={() => setOpenToolbar((prev) => !prev)}
          className={`${buttonClass} ${inactiveClass}`}
        >
          <IoCodeWorkingSharp className="h-6 w-6" />
        </button>
      </div>
      {/* </div > */}
      {/* <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${buttonClass} ${
          editor.isActive("bold") ? activeClass : inactiveClass
        }`}
      >
        <Bold size={18} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${buttonClass} ${
          editor.isActive("italic") ? activeClass : inactiveClass
        }`}
      >
        <Italic size={18} />
      </button> */}
      {openToolbar && (
        <div className="absolute top-full -right-10 mt-8 z-50">
          {" "}
          <div className="bg-white border border-slate-200  shadow-2xl p-4 w-[500px]">
            <div className="flex flex-wrap items-center gap-2">
              {/* Underline */}
              <button
                onClick={() => editor.chain().focus().toggleUnderline?.().run()}
                className={`${buttonClass} ${
                  editor.isActive("underline") ? activeClass : inactiveClass
                }`}
              >
                <Underline size={18} />
              </button>

              {/* Strike */}
              <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`${buttonClass} ${
                  editor.isActive("strike") ? activeClass : inactiveClass
                }`}
              >
                <Strikethrough size={18} />
              </button>

              {/* Divider */}
              <div className="h-7 w-px bg-slate-300 mx-1" />

              {/* Bullet List */}
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`${buttonClass} ${
                  editor.isActive("bulletList") ? activeClass : inactiveClass
                }`}
              >
                <List size={18} />
              </button>

              {/* Ordered List */}
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`${buttonClass} ${
                  editor.isActive("orderedList") ? activeClass : inactiveClass
                }`}
              >
                <ListOrdered size={18} />
              </button>

              {/* Divider */}
              <div className="h-7 w-px bg-slate-300 mx-1" />

              {/* Align Left */}
              <button
                onClick={() =>
                  editor.chain().focus().setTextAlign("left").run()
                }
                className={`${buttonClass} ${
                  editor.isActive({ textAlign: "left" })
                    ? activeClass
                    : inactiveClass
                }`}
              >
                <AlignLeft size={18} />
              </button>

              {/* Align Center */}
              <button
                onClick={() =>
                  editor.chain().focus().setTextAlign("center").run()
                }
                className={`${buttonClass} ${
                  editor.isActive({ textAlign: "center" })
                    ? activeClass
                    : inactiveClass
                }`}
              >
                <AlignCenter size={18} />
              </button>

              {/* Align Right */}
              <button
                onClick={() =>
                  editor.chain().focus().setTextAlign("right").run()
                }
                className={`${buttonClass} ${
                  editor.isActive({ textAlign: "right" })
                    ? activeClass
                    : inactiveClass
                }`}
              >
                <AlignRight size={18} />
              </button>

              {/* Divider */}
              <div className="h-7 w-px bg-slate-300 mx-1" />

              {/* Link */}
              <button className={`${buttonClass}${editor.isActive({})}`}>
                <LinkIcon size={18} />
              </button>

              {/* Image */}
              <button
                className={`${buttonClass} text-[#d1d5db] hover:bg-[#343841]`}
              >
                <ImageIcon size={18} />
              </button>

              {/* Code */}
              <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`${buttonClass} ${
                  editor.isActive("codeBlock") ? activeClass : inactiveClass
                }`}
              >
                <IoCodeSlashOutline className="h-5 w-5" />
              </button>

              {/* Divider */}
              <div className="h-7 w-px bg-slate-300 mx-1" />

              {/* Font Family */}
              <button className="h-10 px-4 flex items-center gap-2 rounded-lg text-[#d1d5db] hover:bg-[#343841]">
                <span className="text-sm font-medium">Arial</span>
                <ChevronDown size={16} />
              </button>

              {/* Font Size */}
              <button className="h-10 px-4 flex items-center gap-2 rounded-lg text-[#d1d5db] hover:bg-[#343841]">
                <span className="text-sm font-medium">10</span>
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menubar;

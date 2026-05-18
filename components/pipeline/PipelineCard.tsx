"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MdAutoAwesome } from "react-icons/md";
import { IoMdMore } from "react-icons/io";
import { PipelineItem } from "./PipelineColumn";

interface Props {
  item: PipelineItem;
  allStages: { stage: string; label: string }[];
  onMove: (toStage: string) => void;
  onDragStart: (e: React.DragEvent) => void;
}

export default function PipelineCard({ item, allStages, onMove, onDragStart }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const getDaysColor = () => {
    if (item.daysLeft <= 3) return "bg-red-100 text-red-600";
    if (item.daysLeft <= 7) return "bg-orange-100 text-orange-600";
    return "bg-slate-100 text-slate-600";
  };

  const otherStages = allStages.filter((s) => s.stage !== item.currentStage);
  const notViable = otherStages.find((s) => s.stage === "blocked");
  const rest = otherStages.filter((s) => s.stage !== "blocked");

  const card = (
    <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3 hover:shadow-md transition select-none">
      <div className="flex justify-between items-center">
        <p className="text-[11px] font-bold text-slate-400">{item.ref}</p>
        <div className="flex items-center gap-1">
          {item.match > 0 && (
            <span className="bg-[#006b5f]/10 text-[#006b5f] border border-[#006b5f]/20 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
              <MdAutoAwesome /> {item.match}%
            </span>
          )}
          {/* Action menu */}
          <div className="relative" ref={menuRef}>
            <button
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((o) => !o); }}
            >
              <IoMdMore className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-7 z-30 w-48 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                {notViable && (
                  <>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMove(notViable.stage); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-[#dc2626] hover:bg-[#fff5f5] transition-colors"
                    >
                      Mark as Not Viable
                    </button>
                    <div className="border-t border-slate-100 mx-3" />
                  </>
                )}
                <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Move to
                </p>
                {rest.map((s) => (
                  <button
                    key={s.stage}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMove(s.stage); setMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <h3 className="font-semibold text-[#1e3a8a] leading-snug text-sm">{item.title}</h3>
      <p className="text-xs text-slate-500">{item.organization}</p>

      <div className="flex justify-between items-center pt-2 border-t border-slate-50">
        <div>
          <p className="text-[10px] text-slate-400 font-bold">BUDGET</p>
          <p className="text-sm font-bold">{item.budget}</p>
        </div>
        {item.daysLeft > 0 && (
          <span className={`text-xs font-semibold px-2 py-1 rounded ${getDaysColor()}`}>
            {item.daysLeft}d left
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing active:opacity-60 transition-opacity"
    >
      {item.href ? <Link href={item.href} draggable={false}>{card}</Link> : card}
    </div>
  );
}

"use client";
import { useState } from "react";
import PipelineCard from "./PipelineCard";

export interface PipelineItem {
  id: string;
  title: string;
  organization: string;
  budget: string;
  daysLeft: number;
  match: number;
  ref: string;
  href?: string;
  currentStage: string;
}

interface Props {
  stage: string;
  title: string;
  count: number;
  items: PipelineItem[];
  allStages: { stage: string; label: string }[];
  onMoveItem: (itemId: string, fromStage: string, toStage: string) => void;
}

export default function PipelineColumn({ stage, title, count, items, allStages, onMoveItem }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const { itemId, fromStage } = JSON.parse(e.dataTransfer.getData("application/json"));
      if (fromStage !== stage) {
        onMoveItem(itemId, fromStage, stage);
      }
    } catch {
      // bad payload — ignore
    }
  }

  const columnColors: Record<string, string> = {
    new: "bg-slate-200 text-slate-600",
    ai_qualified: "bg-[#006b5f]/15 text-[#006b5f]",
    under_review: "bg-amber-100 text-amber-700",
    in_progress: "bg-blue-100 text-blue-700",
    viable: "bg-emerald-100 text-emerald-700",
    blocked: "bg-red-100 text-red-600",
    on_hold: "bg-orange-100 text-orange-600",
    submitted: "bg-purple-100 text-purple-700",
  };

  const countStyle = columnColors[stage] ?? "bg-slate-200 text-slate-600";

  return (
    <section
      className={`flex flex-col min-w-[240px] flex-1 rounded-xl p-4 transition-colors ${
        isDragOver ? "bg-[#edf2ff] ring-2 ring-[#00236f]/30" : "bg-[#F9FAFB]"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {title}
          </h3>
          <span className={`min-w-5 h-5 px-1.5 rounded text-[10px] flex items-center justify-center font-bold ${countStyle}`}>
            {count}
          </span>
        </div>
      </div>

      {/* Drop zone hint when empty + dragging over */}
      {isDragOver && items.length === 0 && (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[#00236f]/30 rounded-lg mb-4 py-8">
          <p className="text-xs text-[#00236f]/60 font-semibold">Drop here</p>
        </div>
      )}

      {/* Empty column placeholder */}
      {!isDragOver && items.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-10">
          <p className="text-xs text-slate-300 font-medium text-center">No tenders</p>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-3 flex-1">
        {items.map((item) => (
          <PipelineCard
            key={item.id}
            item={item}
            allStages={allStages}
            onMove={(toStage) => onMoveItem(item.id, item.currentStage, toStage)}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData(
                "application/json",
                JSON.stringify({ itemId: item.id, fromStage: item.currentStage })
              );
            }}
          />
        ))}
      </div>
    </section>
  );
}

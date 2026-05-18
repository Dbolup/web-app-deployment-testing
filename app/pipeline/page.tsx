"use client";

import PipelineColumn from "@/components/pipeline/PipelineColumn";
import { PipelineItem } from "@/components/pipeline/PipelineColumn";
import { LucideSearch } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { MdFilterList } from "react-icons/md";
import { getPipelineKanban, movePipelineItem, KanbanColumn, Tender } from "@/lib/api";

// All stages in display order — blocked relabelled to "Not Viable" for clarity
const ALL_STAGES: { stage: string; label: string }[] = [
  { stage: "new",          label: "New Tenders"  },
  { stage: "ai_qualified", label: "AI Qualified"  },
  { stage: "under_review", label: "Under Review"  },
  { stage: "in_progress",  label: "In Progress"   },
  { stage: "viable",       label: "Viable"        },
  { stage: "blocked",      label: "Not Viable"    },
  { stage: "on_hold",      label: "On Hold"       },
  { stage: "submitted",    label: "Submitted"     },
];

function stageLabel(stage: string, backendLabel: string): string {
  if (stage === "blocked") return "Not Viable";
  return backendLabel;
}

function formatBudget(t: Tender): string {
  if (t.budget_display) return t.budget_display;
  if (t.budget_max !== null && t.budget_max !== undefined)
    return `£${(Number(t.budget_max) / 1e6).toFixed(1)}M`;
  return "TBD";
}

function toFrontendItem(
  backendItem: KanbanColumn["items"][number],
  stage: string
): PipelineItem {
  const t = backendItem.tender;
  return {
    id: String(backendItem.id),
    ref: t.ref_id,
    title: t.title,
    organization: t.organization,
    budget: formatBudget(t),
    daysLeft: t.days_until_deadline ?? 0,
    match: t.score?.ai_score ?? 0,
    href: `/pipeline/${t.ref_id}`,
    currentStage: stage,
  };
}

export default function PipelinePage() {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortAscending, setSortAscending] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getPipelineKanban()
      .then(setColumns)
      .catch((err) => setError(err.message ?? "Failed to load pipeline"))
      .finally(() => setLoading(false));
  }, []);

  const handleMoveItem = useCallback(
    (itemId: string, fromStage: string, toStage: string) => {
      if (fromStage === toStage) return;

      // Optimistic update
      setColumns((prev) => {
        let movedItem: KanbanColumn["items"][number] | undefined;

        const after = prev.map((col) => {
          if (col.stage === fromStage) {
            movedItem = col.items.find((i) => String(i.id) === itemId);
            return {
              ...col,
              items: col.items.filter((i) => String(i.id) !== itemId),
              count: col.count - 1,
            };
          }
          return col;
        });

        if (!movedItem) return prev;

        return after.map((col) => {
          if (col.stage === toStage) {
            return {
              ...col,
              items: [{ ...movedItem!, stage: toStage }, ...col.items],
              count: col.count + 1,
            };
          }
          return col;
        });
      });

      // Persist to backend; revert on failure
      movePipelineItem(parseInt(itemId), toStage).catch(() => {
        getPipelineKanban().then(setColumns).catch(() => {});
      });
    },
    []
  );

  const filterBySearch = (items: PipelineItem[]) => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.organization.toLowerCase().includes(q)
    );
  };

  const sortByDueDate = (items: PipelineItem[]) =>
    [...items].sort((a, b) =>
      sortAscending ? a.daysLeft - b.daysLeft : b.daysLeft - a.daysLeft
    );

  // Merge backend order with ALL_STAGES so the fixed order is always respected
  const displayColumns = useMemo(() => {
    const byStage = new Map(columns.map((c) => [c.stage, c]));
    return ALL_STAGES.map((s) => {
      const col = byStage.get(s.stage) ?? {
        stage: s.stage,
        label: s.label,
        count: 0,
        items: [],
      };
      const items = sortByDueDate(
        filterBySearch(col.items.map((i) => toFrontendItem(i, s.stage)))
      );
      return { ...col, label: stageLabel(col.stage, col.label), frontendItems: items };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, sortAscending, search]);

  const totalItems = columns.reduce((s, c) => s + c.count, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <section className="px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 outline-none text-sm transition-all"
                placeholder="Search pipeline…"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <MdFilterList className="text-lg" />
              Filters
            </button>
          </div>
          <div className="flex items-center gap-4">
            {!loading && (
              <span className="text-xs text-slate-400 font-medium">
                {totalItems} tender{totalItems !== 1 ? "s" : ""}
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">SORT:</span>
              <button
                className="text-sm font-semibold text-[#00236f] flex items-center gap-1"
                onClick={() => setSortAscending((v) => !v)}
              >
                Due Date
                <FaChevronDown
                  className={`text-sm transition-transform ${sortAscending ? "rotate-0" : "rotate-180"}`}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="px-6 py-3 text-red-500 text-sm shrink-0">{error}</div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {loading ? (
          <div className="flex gap-4 h-full">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 min-w-[220px] bg-slate-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 h-full">
            {displayColumns.map((col) => (
              <PipelineColumn
                key={col.stage}
                stage={col.stage}
                title={col.label}
                count={col.frontendItems.length}
                items={col.frontendItems}
                allStages={ALL_STAGES}
                onMoveItem={handleMoveItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

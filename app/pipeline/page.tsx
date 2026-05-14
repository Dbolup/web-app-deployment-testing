// app/pipeline/page.tsx
"use client";

import PipelineColumn from "@/components/pipeline/PipelineColumn";
import { PipelineItem } from "@/components/pipeline/PipelineColumn";
import { LucideSearch } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { MdFilterList } from "react-icons/md";
import { getPipelineKanban, KanbanColumn, Tender } from "@/lib/api";

function formatBudget(t: Tender): string {
  if (t.budget_display) return t.budget_display;
  if (t.budget_max !== null && t.budget_max !== undefined)
    return `£${(Number(t.budget_max) / 1e6).toFixed(1)}M`;
  return 'TBD';
}

function toFrontendItem(backendItem: KanbanColumn['items'][number]): PipelineItem {
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
  };
}

export default function PipelinePage() {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortAscending, setSortAscending] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getPipelineKanban()
      .then(setColumns)
      .catch((err) => setError(err.message ?? 'Failed to load pipeline'))
      .finally(() => setLoading(false));
  }, []);

  const sortByDueDate = (items: PipelineItem[]) =>
    [...items].sort((a, b) =>
      sortAscending ? a.daysLeft - b.daysLeft : b.daysLeft - a.daysLeft
    );

  const filterBySearch = (items: PipelineItem[]) => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) => i.title.toLowerCase().includes(q) || i.organization.toLowerCase().includes(q)
    );
  };

  const displayColumns = useMemo(
    () =>
      columns
        .filter((col) => col.count > 0)
        .map((col) => ({
          ...col,
          frontendItems: sortByDueDate(filterBySearch(col.items.map(toFrontendItem))),
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, sortAscending, search]
  );

  return (
    <div className="p-6 space-y-6">
      <section className="px-6 py-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 outline-none text-sm transition-all"
                placeholder="Search Pipeline"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
              <MdFilterList className="text-lg" />
              Filters
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-2">SORT BY:</span>
            <button
              className="text-sm font-semibold text-blue-900 flex items-center gap-1 cursor-pointer"
              onClick={() => setSortAscending(!sortAscending)}
            >
              Due Date
              <FaChevronDown
                className={`text-sm transition-transform ${sortAscending ? "rotate-0" : "rotate-180"}`}
              />
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="px-6 py-4 text-red-500 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex gap-6 overflow-x-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-1 min-w-[240px] bg-slate-100 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : displayColumns.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-20">
          No tenders in your pipeline yet.{' '}
          <a href="/discovery" className="text-[#00236f] font-semibold underline">
            Discover tenders
          </a>{' '}
          and add them from the discovery page.
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4">
          {displayColumns.map((col) => (
            <PipelineColumn
              key={col.stage}
              title={col.label}
              count={col.frontendItems.length}
              items={col.frontendItems}
            />
          ))}
        </div>
      )}
    </div>
  );
}

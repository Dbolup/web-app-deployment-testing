// app/pipeline/page.tsx
"use client";

import PipelineColumn from "@/components/pipeline/PipelineColumn";
import { PipelineItem } from "@/components/pipeline/PipelineColumn";
import { LucideSearch } from "lucide-react";
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { MdFilterList } from "react-icons/md";

const newTenders: PipelineItem[] = [
  {
    id: "1",
    ref: "#TR-2024-082",
    title: "Municipal Smart Infrastructure Expansion",
    organization: "Dept. of Transportation",
    budget: "$2.4M",
    daysLeft: 4,
    match: 94,
  },
  {
    id: "2",
    ref: "#TR-2024-105",
    title: "Renewable Energy Grid Management",
    organization: "State Energy Commission",
    budget: "$850K",
    daysLeft: 12,
    match: 88,
  },
];

const aiQualified: PipelineItem[] = [
  {
    id: "3",
    ref: "#TR-2024-004",
    title: "Public Transit Digital Ledger System",
    organization: "Metropolitan Transit Authority",
    budget: "$5.2M",
    daysLeft: 8,
    match: 98,
  },
  {
    id: "4",
    ref: "#TR-2024-012",
    title: "Cloud Migration Phase II",
    organization: "Federal IT Services",
    budget: "$1.1M",
    daysLeft: 14,
    match: 91,
  },
];

const underReview: PipelineItem[] = [
  {
    id: "5",
    ref: "#TR-2023-942",
    title: "National Park Sensor Network",
    organization: "Interior Dept.",
    budget: "$450K",
    daysLeft: 2,
    match: 82,
  },
];

// const sortedNewTenders = [...newTenders].sort(
//   (a, b) => a.daysLeft - b.daysLeft,
// );

// const sortedAiQualified = [...aiQualified].sort(
//   (a, b) => a.daysLeft - b.daysLeft,
// );

// const sortedUnderReview = [...underReview].sort(
//   (a, b) => a.daysLeft - b.daysLeft,
// );
export default function PipelinePage() {
  const [sortAscending, setSortAscending] = useState(true);

  const sortByDueDate = (items: PipelineItem[]) => {
    return [...items].sort((a, b) =>
      sortAscending ? a.daysLeft - b.daysLeft : b.daysLeft - a.daysLeft,
    );
  };

  const sortedNewTenders = sortByDueDate(newTenders);
  const sortedAiQualified = sortByDueDate(aiQualified);
  const sortedUnderReview = sortByDueDate(underReview);
  return (
    <div className="p-6 space-y-6">
      {/* Top Bar */}
      {/* <div className="flex justify-between items-center">
        <input
          placeholder="Search Pipeline"
          className="w-100 px-4 py-2 border rounded-lg text-sm"
        />

        <div className="flex items-center gap-3">
          <button className="border px-4 py-2 rounded-lg text-sm">
            Filters
          </button>

          <span className="text-sm text-slate-500">
            Sort by: <b className="text-[#1e3a8a]">Due Date</b>
          </span>
        </div>
      </div> */}
      <section className="px-6 py-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 outline-none text-sm transition-all"
                placeholder="Search Pipeline"
                type="text"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
              <MdFilterList className="text-lg" />
              Filters
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-2">
              SORT BY:
            </span>
            <button
              className="text-sm font-semibold text-blue-900 flex items-center gap-1 cursor-pointer"
              onClick={() => setSortAscending(!sortAscending)}
            >
              Due Date
              <FaChevronDown
                className={`text-sm transition-transform ${
                  sortAscending ? "rotate-0" : "rotate-180"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Columns */}
      <div className="flex gap-6 overflow-x-auto">
        <PipelineColumn
          title="New Tenders"
          count={sortedNewTenders.length}
          items={sortedNewTenders}
        />

        <PipelineColumn
          title="AI Qualified"
          count={sortedAiQualified.length}
          items={sortedAiQualified}
        />

        <PipelineColumn
          title="Under Review"
          count={sortedUnderReview.length}
          items={sortedUnderReview}
        />
      </div>
    </div>
  );
}
{
  /*
   "surface-container-high": "#e2e8f8",
                    "on-tertiary-fixed": "#2a1700",
                    "on-primary-fixed-variant": "#264191",
                    "on-tertiary": "#ffffff",
                    "surface-dim": "#d3daea",
                    "on-error-container": "#93000a",
                    "background": "#f9f9ff",
                    "tertiary-fixed": "#ffddb8",
                    "tertiary-container": "#5c3800",
                    "on-primary": "#ffffff",
                    "inverse-primary": "#b6c4ff",
                    "secondary-fixed-dim": "#4fdbc8",
                    "inverse-on-surface": "#ebf1ff",
                    "secondary-container": "#6df5e1",
                    "surface-tint": "#4059aa",
                    "surface-container-highest": "#dce2f3",
                    "outline": "#757682",
                    "on-tertiary-container": "#ef9900",
                    "surface-container": "#e7eefe",
                    "error": "#ba1a1a",
                    "outline-variant": "#c5c5d3",
                    "on-surface": "#151c27",
                    "primary": "#00236f",
                    "on-primary-container": "#90a8ff",
                    "error-container": "#ffdad6",
                    "on-secondary-fixed": "#00201c",
                    "tertiary-fixed-dim": "#ffb95f",
                    "surface": "#f9f9ff",
                    "surface-bright": "#f9f9ff",
                    "primary-fixed-dim": "#b6c4ff",
                    "tertiary": "#3e2400",
                    "on-secondary-fixed-variant": "#005048",
                    "primary-fixed": "#dce1ff",
                    "surface-variant": "#dce2f3",
                    "surface-container-lowest": "#ffffff",
                    "primary-container": "#1e3a8a",
                    "on-secondary-container": "#006f64",
                    "inverse-surface": "#2a313d",
                    "secondary": "#006b5f",
                    "on-tertiary-fixed-variant": "#653e00",
                    "on-error": "#ffffff",
                    "on-primary-fixed": "#00164e",
                    "on-background": "#151c27",
                    "surface-container-low": "#f0f3ff",
                    "on-surface-variant": "#444651",
                    "on-secondary": "#ffffff",
                    "secondary-fixed": "#71f8e
  */
}

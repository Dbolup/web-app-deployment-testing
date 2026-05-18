"use client";
import { CiLocationOn } from "react-icons/ci";
import { IoIosClose } from "react-icons/io";
import { TenderFilters } from "@/lib/api";

interface Props {
  filters: TenderFilters;
  onFilterChange: (patch: Partial<TenderFilters>) => void;
}

const INDUSTRIES = [
  "Information Technology",
  "Healthcare",
  "Construction",
  "Professional Services",
  "Defence",
  "Transport",
  "Education",
  "Energy",
];

const NOTICE_TYPES = [
  { value: "", label: "All types" },
  { value: "tender", label: "Tender" },
  { value: "award", label: "Award" },
  { value: "planning", label: "Planning" },
];

export default function FilterSidebar({ filters, onFilterChange }: Props) {
  const budgetMax = filters.budget_max ? Number(filters.budget_max) : 5000000;

  return (
    <aside className="w-72 bg-white p-6 border-r border-slate-200 overflow-y-auto h-full shrink-0">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[11px] font-bold text-[#151c27] uppercase tracking-widest">
          Active Filters
        </h2>
        <button
          onClick={() =>
            onFilterChange({
              search: "",
              industry: "",
              location: "",
              organization: "",
              notice_type: "",
              budget_max: "",
              deadline_before: "",
              ordering: "-published_date",
            })
          }
          className="text-[#00236f] text-[11px] font-bold hover:underline"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-8">
        {/* Search */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-2">
            Search
          </label>
          <input
            type="text"
            value={filters.search}
            placeholder="Title, org, reference…"
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#00236f] outline-none"
          />
        </div>

        {/* Active keyword chips from search */}
        {filters.search && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#1e3a8a]/10 text-[#1e3a8a] text-[12px] font-semibold rounded border border-blue-100">
            {filters.search}
            <button onClick={() => onFilterChange({ search: "" })}>
              <IoIosClose className="h-4 w-4" />
            </button>
          </span>
        )}

        {/* Industry */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-2">
            Industry
          </label>
          <select
            value={filters.industry}
            onChange={(e) => onFilterChange({ industry: e.target.value })}
            className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-[#00236f] focus:ring-0 outline-none"
          >
            <option value="">All industries</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        {/* Notice Type */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-2">
            Notice Type
          </label>
          <select
            value={filters.notice_type}
            onChange={(e) => onFilterChange({ notice_type: e.target.value })}
            className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-[#00236f] focus:ring-0 outline-none"
          >
            {NOTICE_TYPES.map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>
        </div>

        {/* Budget Max */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[12px] font-semibold text-slate-500">
              Max Budget
            </label>
            <span className="text-[11px] font-bold text-slate-900">
              £{(budgetMax / 1_000_000).toFixed(1)}M
            </span>
          </div>
          <input
            type="range"
            min={10_000}
            max={10_000_000}
            step={10_000}
            value={budgetMax}
            onChange={(e) => onFilterChange({ budget_max: e.target.value })}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00236f]"
          />
          <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
            <span>£10k</span>
            <span>£10M+</span>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-2">
            Location
          </label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
              <CiLocationOn />
            </span>
            <input
              type="text"
              placeholder="City or region"
              value={filters.location}
              onChange={(e) => onFilterChange({ location: e.target.value })}
              className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#00236f] outline-none"
            />
          </div>
        </div>

        {/* Deadline before */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-2">
            Deadline Before
          </label>
          <input
            type="date"
            value={filters.deadline_before}
            onChange={(e) => onFilterChange({ deadline_before: e.target.value })}
            className="w-full border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-1 focus:ring-[#00236f] outline-none p-2"
          />
        </div>

        {/* Sort */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-2">
            Sort By
          </label>
          <select
            value={filters.ordering}
            onChange={(e) => onFilterChange({ ordering: e.target.value })}
            className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-[#00236f] focus:ring-0 outline-none"
          >
            <option value="-published_date">Newest first</option>
            <option value="published_date">Oldest first</option>
            <option value="deadline">Deadline (soonest)</option>
            <option value="-deadline">Deadline (latest)</option>
            <option value="-budget_max">Highest budget</option>
            <option value="budget_min">Lowest budget</option>
          </select>
        </div>
      </div>

      <div className="mt-12 p-4 bg-[#1e3a8a] rounded-xl text-white shadow-md">
        <p className="text-[10px] tracking-wider opacity-80 mb-1">
          Upgrade for API
        </p>
        <p className="font-bold text-sm mb-4 leading-tight">
          Real-time Tender Alerts
        </p>
        <button className="w-full py-2 bg-white text-[#00236f] rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">
          Go Premium
        </button>
      </div>
    </aside>
  );
}

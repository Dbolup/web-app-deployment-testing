"use client";
import { useState } from "react";
import { CiLocationOn } from "react-icons/ci";
import { IoIosClose } from "react-icons/io";

export default function Filters() {
  interface FilterSidebarProps {
    onFilterChange?: (filters: any) => void;
  }
  const [budget, setBudget] = useState(2500000);
  const [keywords, setKeywords] = useState(["Cloud Services", "Healthcare"]);

  const removeKeyword = (tag: string) => {
    setKeywords(keywords.filter((k) => k !== tag));
  };
  interface Tender {
    id: string;
    title: string;
    ref: string;
    org: string;
    budget: string;
    deadline: string;
    aiScore: number;
    status: "New" | "Reviewed" | "Selected";
  }
  return (
    <aside className="w-72  bg-white p-6 border-r border-slate-200 overflow-y-auto h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[11px] font-bold text-[#151c27] uppercase tracking-widest">
          Active Filters
        </h2>
        <button
          onClick={() => setKeywords([])}
          className="text-[#00236f] text-[11px] font-bold hover:underline"
        >
          Clear all
        </button>
      </div>

      <div className=" space-y-8">
        {/* Keywords */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-2">
            Keywords
          </label>
          <div className="flex flex-wrap gap-2">
            {keywords.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[#1e3a8a]/10 text-[#1e3a8a] text-[12px] font-semibold rounded border border-blue-100 cursor-pointer"
              >
                {tag}
                <button
                  onClick={() => removeKeyword(tag)}
                  className="cursor-pointer"
                >
                  <IoIosClose className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Industry Dropdown */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 my-2">
            Industry
          </label>
          <select className="w-full text-sm border-slate-200 rounded-lg focus:border-[#00236f] focus:ring-0 outline-none transition-all">
            <option>Information Technology</option>
            <option>Healthcare & Biotech</option>
            <option>Government</option>
            <option>Construction</option>
          </select>
        </div>

        {/* Budget Range Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[12px] font-semibold text-slate-500">
              Budget Range
            </label>
            <span className="text-[11px] font-bold text-slate-900">
              $10k - ${(budget / 1000000).toFixed(1)}M
            </span>
          </div>
          <input
            type="range"
            min="10000"
            max="5000000"
            step="10000"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00236f]"
          />
          <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
            <span>$10k</span>
            <span>$5M+</span>
          </div>
        </div>

        {/* Location Search */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-2">
            Location
          </label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              <CiLocationOn />
            </span>
            <input
              type="text"
              placeholder="City or Country"
              className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* Date Picker */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-2">
            Submission Deadline
          </label>
          <input
            type="date"
            className="w-full border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-1 focus:ring-primary outline-none p-2"
          />
        </div>
      </div>

      {/* Premium CTA */}
      <div className="mt-12 p-4 bg-[#1e3a8a] rounded-xl text-white shadow-md">
        <p className="text-[10px]  tracking-wider opacity-80 mb-1">
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

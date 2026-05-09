import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

const Pagination = () => {
  return (
    <div>
      {/* pagination */}
      <div className="p-6 bg-slate-50 flex items-center justify-between border-t border-slate-200">
        <span className="text-sm text-slate-500">
          Showing <span className="font-bold text-[#151c27]">1-10</span> of 142
          results
        </span>
        <div className="flex gap-2">
          <button className="p-2 border border-slate-300 rounded hover:bg-white transition-colors disabled:opacity-50">
            <FaChevronLeft className="h-2 w-2" />
          </button>
          <button className="px-3 py-2 border border-primary bg-white text-[#00236f] text-xs font-bold rounded">
            1
          </button>
          <button className="px-3 py-2 border border-slate-300 bg-white text-slate-600 text-xs font-bold rounded hover:bg-slate-50">
            2
          </button>
          <button className="px-3 py-2 border border-slate-300 bg-white text-slate-600 text-xs font-bold rounded hover:bg-slate-50">
            3
          </button>
          <button className="p-2 border border-slate-300 rounded hover:bg-white transition-colors">
            <FaChevronRight className="h-2 w-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;

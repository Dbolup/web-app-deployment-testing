import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

interface Props {
  page: number;
  totalCount: number;
  pageSize: number;
  totalPages: number;
  start: number;
  end: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalCount,
  totalPages,
  start,
  end,
  onPageChange,
}: Props) {
  if (totalCount === 0) return null;

  const pages = buildPageList(page, totalPages);

  return (
    <div className="p-6 bg-slate-50 flex items-center justify-between border-t border-slate-200 shrink-0">
      <span className="text-sm text-slate-500">
        Showing{" "}
        <span className="font-bold text-[#151c27]">
          {start}–{end}
        </span>{" "}
        of {totalCount.toLocaleString()} results
      </span>

      <div className="flex gap-2">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="p-2 border border-slate-300 rounded hover:bg-white transition-colors disabled:opacity-30"
        >
          <FaChevronLeft className="h-2 w-2" />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-3 py-2 text-xs text-slate-400 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(Number(p))}
              className={`px-3 py-2 border text-xs font-bold rounded transition-colors ${
                p === page
                  ? "border-[#00236f] bg-white text-[#00236f]"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-2 border border-slate-300 rounded hover:bg-white transition-colors disabled:opacity-30"
        >
          <FaChevronRight className="h-2 w-2" />
        </button>
      </div>
    </div>
  );
}

function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

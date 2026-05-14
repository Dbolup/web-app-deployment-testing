"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IoMdMore } from "react-icons/io";
import { IoFlashOutline } from "react-icons/io5";
import { Tender } from "@/lib/api";

interface Props {
  tender: Tender;
  openAction?: () => void;
  isOpen?: boolean;
}

const statusStyles: Record<string, string> = {
  new: "bg-[#71f8e4] text-[#006f64]",
  selected: "bg-[#dce1ff] text-[#1e3a8a]",
  reviewed: "bg-[#ffddb8] text-[#ef9900]",
  pursue: "bg-[#dcfce7] text-[#16a34a]",
  review: "bg-[#fef9c3] text-[#ca8a04]",
  skip: "bg-[#fee2e2] text-[#dc2626]",
};

function formatBudget(min: number | null, max: number | null, display: string): string {
  if (display) return display;
  if (!min && !max) return "—";
  const fmt = (v: number) =>
    v >= 1_000_000
      ? `£${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
      ? `£${(v / 1_000).toFixed(0)}k`
      : `£${v}`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max)!);
}

function formatDeadline(deadline: string | null, daysLeft: number | null): string {
  if (!deadline) return "—";
  const d = new Date(deadline);
  const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 7) {
    return `${label} (${daysLeft}d left)`;
  }
  return label;
}

export default function TenderRow({ tender, openAction, isOpen }: Props) {
  const router = useRouter();
  const score = tender.score;
  const aiScore = score?.ai_score;
  const status = score?.status ?? "new";
  const deadlineUrgent =
    tender.days_until_deadline !== null && tender.days_until_deadline <= 7;
  const detailHref = `/pipeline/${tender.ref_id}?from=discovery`;

  return (
    <tr
      className="border-t hover:bg-gray-50 cursor-pointer"
      onClick={() => router.push(detailHref)}
    >
      <td className="px-6 py-4 w-60">
        <p className="text-base text-[#151c27] font-medium leading-snug">
          {tender.title}
        </p>
        <span className="text-slate-400 text-[12px]">{tender.ref_id}</span>
      </td>

      <td className="px-6 py-4 text-slate-600 text-sm">
        <div>{tender.organization || "—"}</div>
        {tender.department && tender.department !== tender.organization && (
          <div className="text-xs text-slate-400">{tender.department}</div>
        )}
      </td>

      <td className="px-6 py-4 text-sm font-semibold text-[#151c27]">
        {formatBudget(tender.budget_min, tender.budget_max, tender.budget_display)}
      </td>

      <td
        className={`px-6 py-4 text-sm ${
          deadlineUrgent ? "text-red-600 font-semibold" : "text-slate-600"
        }`}
      >
        {formatDeadline(tender.deadline, tender.days_until_deadline)}
      </td>

      <td className="px-6 py-4 text-sm">
        {aiScore !== null && aiScore !== undefined ? (
          <span className="px-2 py-1 font-bold text-xs rounded flex items-center gap-1 bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20 w-fit">
            <IoFlashOutline className="text-sm" />
            {aiScore}%
          </span>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        )}
      </td>

      <td className="px-6 py-4 text-sm">
        <span
          className={`px-2 py-1 font-bold text-[11px] rounded-full capitalize ${
            statusStyles[status] ?? "bg-slate-100 text-slate-500"
          }`}
        >
          {status}
        </span>
      </td>

      <td className="text-right py-4 px-6 relative">
        <button
          className="text-slate-300 hover:text-slate-600 font-bold"
          onClick={(e) => {
            e.stopPropagation();
            openAction?.();
          }}
        >
          <IoMdMore className="h-6 w-6" />
        </button>
        {isOpen && (
          <div
            className="absolute right-6 top-14 z-20 w-48 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href={detailHref}
              className="block w-full px-4 py-3 text-left text-sm hover:bg-slate-50 transition-colors"
            >
              View Details
            </Link>
            {tender.source_url ? (
              <a
                href={tender.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 text-left text-sm hover:bg-slate-50 transition-colors"
              >
                View on Find a Tender
              </a>
            ) : null}
          </div>
        )}
      </td>
    </tr>
  );
}

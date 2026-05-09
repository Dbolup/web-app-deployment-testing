import { IoMdMore } from "react-icons/io";
import { IoFlashOutline } from "react-icons/io5";
interface Tender {
  organization: string;
  title: string;
  budget: string;
  deadline: string;
  aiScore: number;
  status: "new" | "selected" | "reviewed";
  refId: string;
  openAction?: () => void;
  isOpen?: boolean;
}
const statusStyles = {
  new: "bg-[#71f8e4] text-[#006f64]",

  selected: "bg-[#dce1ff] text-[#1e3a8a]",

  reviewed: "bg-[#ffddb8] text-[#ef9900]",
};

export default function TenderRow(item: Tender) {
  return (
    <tr className="border-t hover:bg-gray-50">
      <td className="px-6 py-4 w-60">
        <p className="text-base text-[#151c27] font-medium">
          {item.title}
          <br />{" "}
          <span className=" text-slate-400 text-[12px] ">{item.refId}</span>
        </p>
      </td>
      <td className="px-6 py-4 text-slate-600 text-sm">{item.organization}</td>
      <td className="px-6 py-4 text-body-sm font-semibold text-[#151c27]">
        {item.budget}
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">{item.deadline}</td>

      <td className="px-6 py-4 text-sm text-slate-600">
        <span
          className={
            item.status === "selected"
              ? "px-2 py-1 font-bold text-xs rounded flex items-center gap-1 bg-slate-100 text-slate-500 border border-[#14B8A6]/20"
              : "px-2 py-1 font-bold text-xs rounded flex items-center gap-1 bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20"
          }
        >
          <IoFlashOutline className="ext-[#14B8A6] text-sm" />
          <div> {item.aiScore}%</div>
        </span>
      </td>

      <td className="px-6 py-4 text-sm text-slate-600">
        <span
          className={`px-2 py-1 font-bold text-[11px] rounded-full capitalize ${
            statusStyles[item.status]
          }`}
        >
          {item.status}
        </span>
      </td>
      <td className="text-right py-4 px-6 relative">
        <button
          className=" text-slate-300 hover:text-slate-600 font-bold "
          onClick={(e) => {
            e.stopPropagation();
            item.openAction?.();
          }}
        >
          <IoMdMore className="h-6 w-6" />
        </button>
        {item.isOpen && (
          <div className="absolute right-6 top-14 z-20 w-44 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <button className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 transition-colors">
              View Tender
            </button>
            <button className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 transition-colors">
              Export Tender
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

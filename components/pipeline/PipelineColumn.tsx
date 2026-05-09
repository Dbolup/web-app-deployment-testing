import { IoIosMore } from "react-icons/io";
import PipelineCard from "./PipelineCard";
export interface PipelineItem {
  id: string;
  title: string;
  organization: string;
  budget: string;
  daysLeft: number;
  match: number;
  ref: string;
}
interface Props {
  title: string;
  count: number;
  items: PipelineItem[];
}

export default function PipelineColumn({ title, count, items }: Props) {
  return (
    <section className="flex-1 overflow-x-auto overflow-y-hidden bg-[#F9FAFB] p-6">
      <div className="flex flex-col gap-6 h-full pb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {title}
            </h3>
            <span className="w-5 h-5 bg-slate-200 rounded text-[10px] flex items-center justify-center font-bold text-slate-600">
              {count}
            </span>
          </div>
          <button className="p-1 hover:bg-slate-200 rounded text-slate-400 cursor-pointer">
            <IoIosMore />
          </button>
        </div>
        <div className="space-y-4">
          {items.map((item) => (
            <PipelineCard key={item.id} item={item} />
          ))}
        </div>
        {/* <div className="kanban-column flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                New Tenders
              </span>
              <span className="w-5 h-5 bg-slate-200 rounded text-[10px] flex items-center justify-center font-bold text-slate-600">
                3
              </span>
            </div>
            <button className="p-1 hover:bg-slate-200 rounded text-slate-400">
              <span className="material-symbols-outlined text-lg">
                more_horiz
              </span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="bg-white border border-gray-200 rounded p-4 hover:border-blue-900/30 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold text-slate-400">
                  #TR-2024-082
                </span>
                <span className="bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">
                    auto_awesome
                  </span>
                  94% MATCH
                </span>
              </div>
              <h3 className="font-label-md text-blue-900 mb-1 leading-snug">
                Municipal Smart Infrastructure Expansion
              </h3>
              <p className="text-[11px] text-slate-500 mb-4">
                Dept. of Transportation
              </p>
              <div className="flex items-center justify-between mt-4 border-t border-slate-50 pt-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold">
                    BUDGET
                  </span>
                  <span className="text-xs font-bold text-on-surface">
                    $2.4M
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-error-container/40 px-2 py-1 rounded">
                  <span className="material-symbols-outlined text-sm text-error">
                    schedule
                  </span>
                  <span className="text-[11px] font-bold text-error">
                    4 Days
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-4 hover:border-blue-900/30 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold text-slate-400">
                  #TR-2024-105
                </span>
                <span className="bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">
                    auto_awesome
                  </span>
                  88% MATCH
                </span>
              </div>
              <h3 className="font-label-md text-blue-900 mb-1 leading-snug">
                Renewable Energy Grid Management
              </h3>
              <p className="text-[11px] text-slate-500 mb-4">
                State Energy Commission
              </p>
              <div className="flex items-center justify-between mt-4 border-t border-slate-50 pt-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold">
                    BUDGET
                  </span>
                  <span className="text-xs font-bold text-on-surface">
                    $850K
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-container-highest px-2 py-1 rounded">
                  <span className="material-symbols-outlined text-sm text-slate-600">
                    schedule
                  </span>
                  <span className="text-[11px] font-bold text-slate-600">
                    12 Days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="kanban-column flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                AI Qualified
              </span>
              <span className="w-5 h-5 bg-secondary/20 rounded text-[10px] flex items-center justify-center font-bold text-secondary">
                5
              </span>
            </div>
            <button className="p-1 hover:bg-slate-200 rounded text-slate-400">
              <span className="material-symbols-outlined text-lg">
                more_horiz
              </span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="bg-white border-2 border-secondary/30 rounded p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rotate-45 translate-x-8 -translate-y-8"></div>
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-[11px] font-bold text-slate-400">
                  #TR-2024-004
                </span>
                <span className="bg-secondary text-white px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">
                    auto_awesome
                  </span>
                  98% MATCH
                </span>
              </div>
              <h3 className="font-label-md text-blue-900 mb-1 leading-snug">
                Public Transit Digital Ledger System
              </h3>
              <p className="text-[11px] text-slate-500 mb-4">
                Metropolitan Transit Authority
              </p>
              <div className="flex items-center justify-between mt-4 border-t border-slate-50 pt-3 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold">
                    BUDGET
                  </span>
                  <span className="text-xs font-bold text-on-surface">
                    $5.2M
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-container-highest px-2 py-1 rounded">
                  <span className="material-symbols-outlined text-sm text-slate-600">
                    schedule
                  </span>
                  <span className="text-[11px] font-bold text-slate-600">
                    8 Days
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-4 hover:border-blue-900/30 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold text-slate-400">
                  #TR-2024-012
                </span>
                <span className="bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">
                    auto_awesome
                  </span>
                  91% MATCH
                </span>
              </div>
              <h3 className="font-label-md text-blue-900 mb-1 leading-snug">
                Cloud Migration Phase II
              </h3>
              <p className="text-[11px] text-slate-500 mb-4">
                Federal IT Services
              </p>
              <div className="flex items-center justify-between mt-4 border-t border-slate-50 pt-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold">
                    BUDGET
                  </span>
                  <span className="text-xs font-bold text-on-surface">
                    $1.1M
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-container-highest px-2 py-1 rounded">
                  <span className="material-symbols-outlined text-sm text-slate-600">
                    schedule
                  </span>
                  <span className="text-[11px] font-bold text-slate-600">
                    14 Days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        / */}
      </div>
    </section>
    // <div className="flex-1 min-w-75">
    //   <div className="flex justify-between items-center mb-4">
    //     <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
    //       {title}
    //     </h3>
    //     <span className="text-xs bg-slate-200 px-2 py-0.5 rounded">
    //       {count}
    //     </span>
    //   </div>

    //   <div className="space-y-4">
    //     {items.map((item) => (
    //       <PipelineCard key={item.id} item={item} />
    //     ))}
    //   </div>
    // </div>
  );
}

"use client";
import { BsStars } from "react-icons/bs";
import TenderRow from "./TenderRow";
import Pagination from "./Pagination";
import { useEffect, useState } from "react";

// import React, { useState } from "react";

// interface FilterSidebarProps {
//   onFilterChange?: (filters: any) => void;
// }

// export default function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
//   const [budget, setBudget] = useState(2500000);
//   const [keywords, setKeywords] = useState(["Cloud Services", "Healthcare"]);

//   const removeKeyword = (tag: string) => {
//     setKeywords(keywords.filter((k) => k !== tag));
//   };
//   interface Tender {
//     id: string;
//     title: string;
//     ref: string;
//     org: string;
//     budget: string;
//     deadline: string;
//     aiScore: number;
//     status: "New" | "Reviewed" | "Selected";
//   }
//   const tenders: Tender[] = [
//     {
//       id: "1",
//       title: "Enterprise Cloud Migration",
//       ref: "TF-2024-9921",
//       org: "Dept. of Veterans Affairs",
//       budget: "$2,450,000",
//       deadline: "Oct 24, 2024",
//       aiScore: 98,
//       status: "New",
//     },
//   ];
//   return (
//     <div className="grid grid-cols-4 gap-6 ">
//       <aside className="w-full  bg-white p-6 border-r border-slate-200 overflow-y-auto h-full">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">
//             Active Filters
//           </h2>
//           <button
//             onClick={() => setKeywords([])}
//             className="text-primary text-[11px] font-bold hover:underline"
//           >
//             Clear all
//           </button>
//         </div>

//         <div className="space-y-8">
//           {/* Keywords */}
//           <div>
//             <label className="block text-[12px] font-semibold text-slate-500 mb-2">
//               Keywords
//             </label>
//             <div className="flex flex-wrap gap-2">
//               {keywords.map((tag) => (
//                 <span
//                   key={tag}
//                   className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-[12px] font-semibold rounded border border-blue-100"
//                 >
//                   {tag}
//                   <button onClick={() => removeKeyword(tag)}>
//                     <span className="material-symbols-outlined text-[14px] leading-none">
//                       close
//                     </span>
//                   </button>
//                 </span>
//               ))}
//             </div>
//           </div>

//           {/* Industry Dropdown */}
//           <div>
//             <label className="block text-[12px] font-semibold text-slate-500 mb-2">
//               Industry
//             </label>
//             <select className="w-full text-sm border-slate-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
//               <option>Information Technology</option>
//               <option>Healthcare & Biotech</option>
//               <option>Government</option>
//               <option>Construction</option>
//             </select>
//           </div>

//           {/* Budget Range Slider */}
//           <div>
//             <div className="flex justify-between items-center mb-2">
//               <label className="text-[12px] font-semibold text-slate-500">
//                 Budget Range
//               </label>
//               <span className="text-[11px] font-bold text-slate-900">
//                 $10k - ${(budget / 1000000).toFixed(1)}M
//               </span>
//             </div>
//             <input
//               type="range"
//               min="10000"
//               max="5000000"
//               step="10000"
//               value={budget}
//               onChange={(e) => setBudget(Number(e.target.value))}
//               className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
//             />
//             <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
//               <span>$10k</span>
//               <span>$5M+</span>
//             </div>
//           </div>

//           {/* Location Search */}
//           <div>
//             <label className="block text-[12px] font-semibold text-slate-500 mb-2">
//               Location
//             </label>
//             <div className="relative">
//               <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
//                 location_on
//               </span>
//               <input
//                 type="text"
//                 placeholder="City or Country"
//                 className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
//               />
//             </div>
//           </div>

//           {/* Date Picker */}
//           <div>
//             <label className="block text-[12px] font-semibold text-slate-500 mb-2">
//               Submission Deadline
//             </label>
//             <input
//               type="date"
//               className="w-full border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-1 focus:ring-primary outline-none p-2"
//             />
//           </div>
//         </div>

//         {/* Premium CTA */}
//         <div className="mt-12 p-4 bg-primary-container rounded-xl text-white shadow-md">
//           <p className="text-[10px] uppercase tracking-wider opacity-80 mb-1">
//             Upgrade for API
//           </p>
//           <p className="font-bold text-sm mb-4 leading-tight">
//             Real-time Tender Alerts
//           </p>
//           <button className="w-full py-2 bg-white text-primary rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">
//             Go Premium
//           </button>
//         </div>
//       </aside>
//       <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm col-span-3">
//         <table className="w-full text-left border-collapse">
//           <thead>
//             <tr className="bg-slate-50 border-b border-slate-200">
//               <th className="px-lg py-md text-[11px] font-bold uppercase text-slate-500">
//                 Tender Title
//               </th>
//               <th className="px-lg py-md text-[11px] font-bold uppercase text-slate-500">
//                 Organization
//               </th>
//               <th className="px-lg py-md text-[11px] font-bold uppercase text-slate-500">
//                 Budget
//               </th>
//               <th className="px-lg py-md text-[11px] font-bold uppercase text-slate-500 text-center">
//                 AI Score
//               </th>
//               <th className="px-lg py-md text-[11px] font-bold uppercase text-slate-500">
//                 Status
//               </th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {tenders.map((tender) => (
//               <tr
//                 key={tender.id}
//                 className="hover:bg-slate-50 transition-colors cursor-pointer"
//               >
//                 <td className="px-lg py-md">
//                   <div className="font-semibold text-sm">{tender.title}</div>
//                   <div className="text-[12px] text-slate-400">{tender.ref}</div>
//                 </td>
//                 <td className="px-lg py-md text-sm text-slate-600">
//                   {tender.org}
//                 </td>
//                 <td className="px-lg py-md text-sm font-bold">
//                   {tender.budget}
//                 </td>
//                 <td className="px-lg py-md">
//                   <div className="flex justify-center">
//                     <span className="px-2 py-1 bg-[#14B8A6]/10 text-[#14B8A6] rounded-md font-bold text-xs border border-[#14B8A6]/20">
//                       {tender.aiScore}%
//                     </span>
//                   </div>
//                 </td>
//                 <td className="px-lg py-md">
//                   <span
//                     className={`px-2 py-1 rounded-full text-[11px] font-bold ${
//                       tender.status === "New"
//                         ? "bg-emerald-100 text-emerald-700"
//                         : "bg-amber-100 text-amber-700"
//                     }`}
//                   >
//                     {tender.status}
//                   </span>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

const data: Array<{
  title: string;
  organization: string;
  budget: string;
  deadline: string;
  aiScore: number;
  status: "new" | "selected" | "reviewed";
  refId: string;
}> = [
  {
    title: "Enterprise Cloud Migration Framework",
    organization: "Dept. of Veterans Affairs",
    budget: "$2,450,000",
    deadline: "Oct 24, 2024",
    aiScore: 98,
    status: "new",
    refId: "Ref: TF-2024-9921",
  },
  {
    title: "AI-Driven Patient Monitoring System",
    organization: "DHHS Health Services",
    budget: "$890,000",
    deadline: "Nov 12, 2024",
    aiScore: 91,
    status: "reviewed",
    refId: "Ref: HHS-BETA-441",
  },
  {
    title: "Regional Data Center Modernization",
    organization: "General Services Admin",
    budget: "$4,100,000",
    deadline: "Dec 01, 2024",
    aiScore: 74,
    status: "selected",
    refId: "Ref: GSA-R10-552",
  },
  {
    title: "Cybersecurity Audit &amp; Compliance",
    organization: "Dept. of Homeland Security",
    budget: "$320,000",
    deadline: "Oct 19, 2024",
    aiScore: 88,
    status: "new",
    refId: "Ref: DHS-AUD-202",
  },
];

export default function TenderTable() {
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  useEffect(() => {
    const closeDropdown = () => setOpenDropdown(null);

    window.addEventListener("click", closeDropdown);

    return () => window.removeEventListener("click", closeDropdown);
  }, []);

  return (
    <section className="flex-1 p-6 flex flex-col grow w-full">
      <div className="pb-6">
        <h2 className="text-xl font-bold text-[#151c27]">Tender Discovery</h2>
        <div className="flex justify-between items-center ">
          <div>
            <p className="text-slate-500">
              Scanning 2 new opportunities today across your selected domain
            </p>
          </div>
          <div className="bg-slate-200 py-2 pl-4 pr-2 flex items-center gap-4 w-fit">
            <div className="text-sm font-semibold text-slate-500">
              Raw Results
            </div>
            <div>
              <button className="px-6 py-2 text-xs font-bold bg-white rounded-md shadow-sm flex items-center gap-2 text-[#00236f]">
                <BsStars className="h-4 w-4 " />
                AI Filtered
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white border rounded-xl overflow-hidden h-full">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-slate-500 uppercase">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Organization</th>
              <th className="px-6 py-4">Budget</th>
              <th className="px-6 py-4">Deadline</th>
              <th className="px-6 py-4">Score</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item, i) => (
              <TenderRow
                key={i}
                {...item}
                isOpen={openDropdown === i}
                openAction={() =>
                  setOpenDropdown(openDropdown === i ? null : i)
                }
              />
            ))}
          </tbody>
        </table>
        <Pagination />
      </div>
    </section>
  );
}
{
  /*"colors": {
                "on-tertiary-fixed-variant": "#653e00",
                "on-tertiary-container": "#ef9900",
                "tertiary-fixed": "#ffddb8",
                "secondary-fixed-dim": "#4fdbc8",
                "on-error-container": "#93000a",
                "surface-bright": "#f9f9ff",
                "on-secondary-fixed": "#00201c",
                "on-secondary-container": "#006f64",
                "primary-container": "#1e3a8a",
                "tertiary-container": "#5c3800",
                "primary-fixed": "#dce1ff",
                "inverse-surface": "#2a313d",
                "surface-container-lowest": "#ffffff",
                "inverse-on-surface": "#ebf1ff",
                "surface-tint": "#4059aa",
                "surface-container": "#e7eefe",
                "on-surface-variant": "#444651",
                "background": "#f9f9ff",
                "on-surface": "#151c27",
                "surface": "#f9f9ff",
                "on-tertiary-fixed": "#2a1700",
                "on-primary-fixed-variant": "#264191",
                "tertiary": "#3e2400",
                "surface-container-high": "#e2e8f8",
                "on-secondary-fixed-variant": "#005048",
                "primary": "#00236f",
                "on-primary-fixed": "#00164e",
                "on-background": "#151c27",
                "on-error": "#ffffff",
                "surface-variant": "#dce2f3",
                "surface-container-low": "#f0f3ff",
                "error-container": "#ffdad6",
                "secondary-fixed": "#71f8e4",
                "tertiary-fixed-dim": "#ffb95f",
                "on-primary-container": "#90a8ff",
                "secondary": "#006b5f",
                "inverse-primary": "#b6c4ff",
                "secondary-container": "#6df5e1",
                "outline-variant": "#c5c5d3",
                "outline": "#757682",
                "surface-dim": "#d3daea",
                "primary-fixed-dim": "#b6c4ff",
                "on-primary": "#ffffff",
                "error": "#ba1a1a",
                "on-secondary": "#ffffff",
                "surface-container-highest": "#dce2f3",
                "on-tertiary": "#ffffff"
            }, */
}

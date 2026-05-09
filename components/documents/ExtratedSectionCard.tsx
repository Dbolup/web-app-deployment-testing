// components/ExtractedSectionCard.tsx
import React from "react";
import { FaChevronRight } from "react-icons/fa6";

interface ExtractedSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  status?: string;
  isList?: boolean;
}

export const ExtractedSectionCard: React.FC<ExtractedSectionProps> = ({
  title,
  icon,
  children,
  status,
  isList,
}) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[#00236f] bg-[#00236f]/5 p-1.5 text-xl border rounded">
        {icon}
      </span>

      <h3 className="font-bold text-slate-800 text-sm tracking-tight capitalize">
        {title}
      </h3>
    </div>

    <div className="grow  leading-relaxed  ">
      {children}
      {/* {isList && Array.isArray(content) ? (
        <ul className="space-y-2">
          {content.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-1 h-1 bg-blue-400 rounded-full shrink-0" />{" "}
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p>{content}</p>
      )} */}
    </div>

    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
      {status && (
        <span className="text-[10px] font-black uppercase tracking-wider text-[#006b5f] bg-[#006b5f]/20 px-2 py-0.5 rounded">
          {status}
        </span>
      )}
      <span className="material-symbols-outlined text-slate-300 group-hover:text-[#00236f] transition-colors cursor-pointer">
        <FaChevronRight />
      </span>
    </div>
  </div>
);

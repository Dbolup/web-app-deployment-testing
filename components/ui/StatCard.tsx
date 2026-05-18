"use client";

import { MdAutoAwesome } from "react-icons/md";

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  highlight?: boolean;
  change?: number | null;
};

export default function StatCard({
  title,
  value,
  subtitle,
  highlight = false,
  change,
}: Props) {
  return (
    <div
      className={`bg-white rounded-xl flex flex-col justify-between p-6 border ${
        highlight ? "border-[#006b5f] relative" : "border-[#c5c5d3]"
      }`}
    >
      <div className={`${highlight ? "absolute top-0 right-0 z-0 p-2" : "hidden"}`}>
        <MdAutoAwesome className="text-4xl text-[#006b5f] opacity-20 font-bold" />
      </div>

      <div className="flex gap-1 items-center">
        <MdAutoAwesome className={`${highlight ? "text-xs text-[#006b5f]" : "hidden"}`} />
        <p
          className={
            highlight
              ? "text-base text-[#006b5f] uppercase tracking-wider font-bold z-10"
              : "text-base text-[#757682] uppercase tracking-wider font-bold z-10"
          }
        >
          {title}
        </p>
      </div>

      <div className="flex items-end gap-2 mt-2">
        <h2
          className={
            highlight
              ? "text-[#006b5f] font-bold text-3xl"
              : "text-3xl font-bold text-[#151c27]"
          }
        >
          {value}
        </h2>

        {subtitle && (
          <span
            className={
              highlight
                ? "text-sm text-[#006b5f] font-bold uppercase bg-[#F0FFF0] rounded-sm px-2 py-1"
                : "text-sm text-[#006b5f] font-bold capitalize"
            }
          >
            {subtitle}
          </span>
        )}
      </div>

      {change != null && (
        <div className={`flex items-center gap-1 text-xs font-semibold mt-2 ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          <span>{change >= 0 ? '↑' : '↓'} {Math.abs(change)}%</span>
          <span className="text-gray-400 font-normal">vs prev period</span>
        </div>
      )}
    </div>
  );
}

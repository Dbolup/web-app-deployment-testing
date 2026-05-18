"use client";

import { User } from "lucide-react";
import { BiCloudUpload } from "react-icons/bi";
import { MdEditNote, MdSmartToy } from "react-icons/md";
import { ActivityItem } from "@/lib/api";

const activityStyles: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
  ai: {
    icon: <MdSmartToy className="w-4 h-4" />,
    bg: "bg-[#006b5f]/10",
    text: "text-[#006b5f]",
  },
  system: {
    icon: <BiCloudUpload className="w-4 h-4" />,
    bg: "bg-[#00236f]/10",
    text: "text-[#00236f]",
  },
  user: {
    icon: <User className="w-4 h-4" />,
    bg: "bg-slate-100",
    text: "text-slate-400",
  },
  drafted: {
    icon: <MdEditNote className="w-4 h-4" />,
    bg: "bg-[#ef9900]/10",
    text: "text-[#ef9900]",
  },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function Skeleton() {
  return (
    <ul className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 bg-gray-100 rounded w-4/5" />
            <div className="h-2 bg-gray-100 rounded w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ActivityCard({
  activities,
  loading,
}: {
  activities?: ActivityItem[];
  loading?: boolean;
}) {
  const items = activities ?? [];

  return (
    <div className="bg-white p-6 rounded-xl border flex flex-col h-full">
      <h3 className="font-bold text-2xl text-[#00236f] mb-4 flex-shrink-0">
        Recent Activity
      </h3>

      <div className="flex-1 overflow-y-auto max-h-72 pr-1">
        {loading ? (
          <Skeleton />
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            No activity yet. Actions on tenders will appear here.
          </p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => {
              const style = activityStyles[item.activity_type] ?? activityStyles.system;
              return (
                <li key={item.id} className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${style.bg} ${style.text} flex-shrink-0`}>
                    {style.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 leading-snug">
                      {item.prefix}{" "}
                      <span className="font-bold">{item.highlight}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {relativeTime(item.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex justify-center mt-4 pt-3 border-t flex-shrink-0">
        <button className="text-[#173c77] text-sm font-semibold hover:underline">
          View All Activity
        </button>
      </div>
    </div>
  );
}

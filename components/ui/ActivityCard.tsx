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

export default function ActivityCard({ activities }: { activities?: ActivityItem[] }) {
  const items = activities ?? [];

  return (
    <div className="bg-white p-6 rounded-xl border">
      <h3 className="font-bold text-2xl text-[#00236f] mb-4">
        Recent Activity
      </h3>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No activity yet.</p>
      ) : (
        <ul className="space-y-10">
          {items.map((item) => {
            const style = activityStyles[item.activity_type] ?? activityStyles.system;
            return (
              <li key={item.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${style.bg} ${style.text}`}>
                  {style.icon}
                </div>
                <div>
                  <p className="text-base text-gray-700 w-50">
                    {item.prefix}{" "}
                    <span className="font-bold">{item.highlight}</span>
                  </p>
                  <p className="text-sm text-gray-500">{relativeTime(item.created_at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex justify-center">
        <button className="text-[#173c77] text-base mt-5 text-center font-semibold">
          View All Activity
        </button>
      </div>
    </div>
  );
}

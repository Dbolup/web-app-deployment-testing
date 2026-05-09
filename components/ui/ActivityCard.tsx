"use client";

import { Bot, Settings, User } from "lucide-react";
import { BiCloudUpload } from "react-icons/bi";
import { FaRobot } from "react-icons/fa6";
import { MdEditNote, MdSmartToy } from "react-icons/md";
type Activity = {
  id: string;
  prefix: string;
  highlight: string;
  time: string;
  type: string;
};
const activityStyles: any = {
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
const activities: Activity[] = [
  {
    id: "1",
    prefix: "AI analyzed",
    highlight: "Tender #402",
    time: "2 mins ago",
    type: "ai",
  },
  {
    id: "2",
    highlight: "Confluence",
    prefix: "Proposal pushed to ",
    time: "1 hour ago",
    type: "system",
  },
  {
    id: "3",
    highlight: "Smart City RFP",
    prefix: "Draft updated for ",
    time: "3 hours ago",
    type: "drafted",
  },
  {
    id: "4",
    highlight: "Sarah Miller",
    prefix: "Alex invited ",
    time: "Yesterday",
    type: "user",
  },
];

export default function ActivityCard() {
  return (
    <div className="bg-white p-6 rounded-xl border  ">
      <h3 className="font-bold text-2xl text-[#00236f] mb-4">
        Recent Activity
      </h3>

      <ul className="space-y-10">
        {activities.map((item) => {
          const style = activityStyles[item.type] || activityStyles.system; // fallback

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
                <p className="text-sm text-gray-500">{item.time}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-center">
        <button className="text-[#173c77] text-base mt-5 text-center font-sembold">
          View All Activity
        </button>
      </div>
    </div>
  );
}

// import ActivityCard from "../ActivityCard";
// import Button from "../Button";
// import Header from "../Header";
// import Sidebar from "../Sidebar";
// import StatCard from "../StatCard";
// import TenderCard from "../TenderCard";
"use client";
import { useState } from "react";
import ActivityCard from "../../components/ui/ActivityCard";
import { ChartBarStacked } from "../../components/ui/Barchart";
import StatCard from "../../components/ui/StatCard";
import TenderCard from "../../components/ui/TenderCard";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function Dashboard() {
  const tender = [
    {
      id: "tr-2024-001",
      refId: "#TR-2024-001",
      percentage: 94,
      dueDays: "4 days",
      title: "municipal smart infrasstructure grid expansion",
      budget: "$2.5M",
      rfp: "2024-FED-011",
      department: "dept. of transportation & urban dev",
    },
    {
      id: "tr-2024-089",
      refId: "#TR-2024-089",
      percentage: 88,
      dueDays: "12 days",
      title: "enterprise cyber security framework refresh",
      budget: "$850K",
      rfp: "2024-FED-011",
      department: "federal information security agency",
    },
    {
      id: "tr-2024-112",
      refId: "#TR-2024-112",
      percentage: 82,
      dueDays: "18 days",
      title: "health cloud data migration & interoperability",
      budget: "$4.2M",
      rfp: "2024-FED-011",
      department: "national institute of health services",
    },
  ];
  const stats = [
    {
      title: "total tenders pulled",
      total: "1284",
      rate: "+12%",
      highlight: false,
    },
    {
      title: "AI-qualified tenders",
      total: "42",
      rate: "ready",
      highlight: true,
    },
    {
      title: "in progress",
      total: "12",
      rate: "",
      highlight: false,
    },
    {
      title: "submitted",
      total: "5",
      rate: "80% win rate",
      highlight: false,
    },
  ];
  const [activeDays, setActiveDays] = useState(true);
  return (
    // <div className="flex h-screen bg-[#F5F7FB]">
    <main className="flex-1  overflow-y-auto pb-20">
      <div className="px-6">
        <h1 className="text-4xl font-bold text-[#00236f] mt-4 ">
          Welcome back, Alex.
        </h1>
        <p className="text-gray-600 mb-6 text-lg ">
          Here's your tender pipeline overview for today.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatCard
              title={stat.title}
              value={stat.total}
              highlight={stat.highlight}
              key={index}
              subtitle={stat.rate}
            />
          ))}
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          {/* Chart */}
          <div className="col-span-3 bg-white rounded-xl p-8 border">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-2xl mb-4 text-[#00236f]">
                Tender Trends
              </h3>
              <div className="flex gap-4 ">
                <Button
                  title="last 30 days"
                  active={activeDays}
                  className={`${activeDays ? " bg-indigo-200" : "bg-none"}`}
                  onlick={() => setActiveDays(!activeDays)}
                />
                <Button
                  title="last 90 days"
                  active={!activeDays}
                  className={`${activeDays ? " bg-indigo-200" : "bg-none"}`}
                  onlick={() => setActiveDays(!activeDays)}
                />
              </div>
            </div>
            {/* Fake chart */}
            <ChartBarStacked />
          </div>

          <ActivityCard />
        </div>

        {/* Bottom */}
        <div>
          <div className="flex justify-between items-center mb-8 mt-10">
            <div>
              <h3 className="font-semibold text-[#00236f] text-4xl">
                Top Recommended Tenders
              </h3>
              <p className="text-gray-600 text-base pt-2">
                Based on your historical win rates and current capacity.
              </p>
            </div>
            <Link
              href="/discovery"
              className="text-[#00236f] text-base font-bold"
            >
              Explore All →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {tender.map((item) => (
              <Link key={item.refId} href={`/pipeline/${item.id}`}>
                <TenderCard
                  key={item.refId}
                  id={item.refId}
                  title={item.title}
                  organization={item.department}
                  budget={item.budget}
                  deadline={item.dueDays}
                  score={item.percentage}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
    // </div>
  );
}

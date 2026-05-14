"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ActivityCard from "../../components/ui/ActivityCard";
import { ChartBarStacked, groupTrendByWeek } from "../../components/ui/Barchart";
import StatCard from "../../components/ui/StatCard";
import TenderCard from "../../components/ui/TenderCard";
import Button from "@/components/ui/Button";
import {
  getDashboardStats,
  getTopTenders,
  getActivity,
  getMe,
  DashboardStats,
  Tender,
  ActivityItem,
} from "@/lib/api";

function formatBudget(t: Tender): string {
  if (t.budget_display) return t.budget_display;
  if (t.budget_max !== null && t.budget_max !== undefined)
    return `£${(Number(t.budget_max) / 1e6).toFixed(1)}M`;
  return 'TBD';
}

function formatDaysLeft(days: number | null): string {
  if (days === null || days === undefined) return '—';
  if (days === 0) return 'Today';
  return `${days} day${days === 1 ? '' : 's'}`;
}

export default function Dashboard() {
  const [activeDays, setActiveDays] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [stats90, setStats90] = useState<DashboardStats | null>(null);
  const [topTenders, setTopTenders] = useState<Tender[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(30),
      getDashboardStats(90),
      getTopTenders(3),
      getActivity(),
      getMe(),
    ])
      .then(([s30, s90, tenders, acts, me]) => {
        setStats(s30);
        setStats90(s90);
        setTopTenders(tenders);
        setActivities(acts);
        setUserName(me.first_name || me.full_name.split(' ')[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentStats = activeDays ? stats : stats90;

  const statCards = [
    {
      title: "Total tenders pulled",
      total: currentStats ? currentStats.total_tenders.toLocaleString() : '—',
      rate: '',
      highlight: false,
    },
    {
      title: "AI-qualified tenders",
      total: currentStats ? String(currentStats.ai_qualified) : '—',
      rate: "ready",
      highlight: true,
    },
    {
      title: "In progress",
      total: currentStats ? String(currentStats.in_progress) : '—',
      rate: "",
      highlight: false,
    },
    {
      title: "Submitted",
      total: currentStats ? String(currentStats.submitted) : '—',
      rate: "",
      highlight: false,
    },
  ];

  const trendData = groupTrendByWeek(currentStats?.trend_data ?? []);

  return (
    <main className="flex-1 overflow-y-auto pb-20">
      <div className="px-6">
        <h1 className="text-4xl font-bold text-[#00236f] mt-4">
          {loading ? 'Welcome back.' : `Welcome back, ${userName}.`}
        </h1>
        <p className="text-gray-600 mb-6 text-lg">
          Here&apos;s your tender pipeline overview for today.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={loading ? '…' : stat.total}
              highlight={stat.highlight}
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
              <div className="flex gap-4">
                <Button
                  title="last 30 days"
                  active={activeDays}
                  className={`${activeDays ? "bg-indigo-200" : "bg-none"}`}
                  onlick={() => setActiveDays(true)}
                />
                <Button
                  title="last 90 days"
                  active={!activeDays}
                  className={`${!activeDays ? "bg-indigo-200" : "bg-none"}`}
                  onlick={() => setActiveDays(false)}
                />
              </div>
            </div>
            <ChartBarStacked data={trendData} />
          </div>

          <ActivityCard activities={activities} />
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
            <Link href="/discovery" className="text-[#00236f] text-base font-bold">
              Explore All →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white p-10 rounded-xl border border-gray-300 animate-pulse h-52" />
                ))
              : topTenders.length === 0
              ? (
                <div className="col-span-3 text-center text-slate-400 text-sm py-10">
                  No recommended tenders yet. Trigger AI reviews from the Discovery page to populate this section.
                </div>
              )
              : topTenders.map((tender) => (
                  <Link key={tender.ref_id} href={`/pipeline/${tender.ref_id}`}>
                    <TenderCard
                      id={tender.ref_id}
                      title={tender.title}
                      organization={tender.organization}
                      budget={formatBudget(tender)}
                      deadline={formatDaysLeft(tender.days_until_deadline)}
                      score={tender.score?.ai_score ?? undefined}
                    />
                  </Link>
                ))}
          </div>
        </div>
      </div>
    </main>
  );
}

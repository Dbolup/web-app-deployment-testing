import Image from "next/image";
import {
  Bell,
  MessageSquare,
  LayoutDashboard,
  Search,
  FileText,
  FolderKanban,
  Settings,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Share2,
  Download,
} from "lucide-react";
interface TenderDetailsPageProps {
  params: {
    refId: string;
  };
}
export default async function TenderAnalysisPage({
  params,
}: TenderDetailsPageProps) {
  const { refId } = await params;

  const tenders = [
    {
      id: "tr-2024-001",
      refId: "#TR-2024-001",
      percentage: 94,
      dueDays: "4 days",
      title: "municipal smart infrastructure grid expansion",
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
  ];

  const tender = tenders.find((item) => item.id === refId);

  if (!tender) {
    return <div className="p-10">Tender not found</div>;
  }

  return (
    // <div className="min-h-screen bg-[#f5f7fc] flex text-[#151c27]">

    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-wide font-bold text-[#a1a9b8]">
          <span>Active Pipeline</span>
          <span>/</span>
          <span>US Federal Tenders</span>
          <span>/</span>
          <span>ID: TF-9982-A</span>
        </div>

        {/* Grid */}
        <div className="mt-6 grid grid-cols-12 gap-6">
          {/* Left Card */}
          <section className="col-span-8 bg-white rounded-3xl border border-[#e5e7eb] overflow-hidden shadow-sm">
            {/* Top */}
            <div className="p-8 border-b border-[#eef1f6]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 shadow-md text-sm font-bold">
                    RFP: {tender.rfp}
                  </div>

                  <h1 className="mt-6 text-5xl leading-[1.05] font-black text-[#173b8f] max-w-[700px] capitalize">
                    {tender.title}
                  </h1>

                  <p className="mt-6 text-[22px] leading-[1.8] text-slate-500 max-w-[800px]">
                    The Department of General Services is seeking comprehensive
                    proposals for the large-scale modernization of legacy
                    systems across three major federal agencies.
                  </p>
                </div>

                <div className="flex items-center gap-5 text-slate-400">
                  <button className="p-1.5 hover:bg-slate-50 rounded transition-colors text-slate-400">
                    <Share2 className="h-6 w-6" />
                  </button>

                  <button className="p-1.5 hover:bg-slate-50 rounded transition-colors text-slate-400">
                    <Download className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8">
              {/* Section Title */}
              <div className="flex items-center gap-3 mb-6">
                <div className=" flex items-center justify-center text-[#173b8f]">
                  <FileText className="h-5 w-5" />
                </div>

                <h2 className="text-[24px] font-bold text-[#173b8f]">
                  Project Scope & Requirements
                </h2>
              </div>

              <div className="space-y-8 text-[22px] leading-[2] text-slate-600">
                <p>
                  The primary objective is to transition from on-premise
                  monolithic architectures to
                  <span className="font-bold text-[#173b8f] underline ml-2">
                    secure cloud-native environments
                  </span>
                  . Vendors must demonstrate a minimum of 10 years experience in
                  public sector digital transformation.
                </p>

                <p>
                  Required services include but are not limited to
                  <span className="font-bold text-[#173b8f] underline ml-2">
                    Cloud Migration
                  </span>
                  of 500+ microservices, data lake consolidation, and continuous
                  integration pipelines.
                  <span className="font-bold text-[#173b8f] underline ml-2">
                    Post-Migration Support
                  </span>
                  for a duration of 24 months.
                </p>

                <p>
                  Security is paramount. All personnel involved in the project
                  must hold an
                  <span className="font-bold text-[#b45309] underline ml-2">
                    On-site Security Clearance Level 4
                  </span>
                  or higher.
                </p>
              </div>

              {/* Image */}
              <div className="mt-10 rounded-2xl overflow-hidden border border-slate-200 h-[320px] bg-[#061c3d] flex items-center justify-center">
                <div className="text-center text-cyan-300">
                  <div className="text-7xl mb-4">🌐</div>
                  <p className="text-xl font-semibold">
                    Infrastructure Visualization
                  </p>
                </div>
              </div>

              <p className="mt-8 text-[22px] leading-[2] text-slate-600">
                Final delivery milestones are structured across four phases over
                an 18-month timeline. Phase I focuses on discovery and
                assessment, followed by environment provisioning in Phase II.
              </p>
            </div>
          </section>

          {/* Right Sidebar */}
          <aside className="col-span-4 bg-white rounded-3xl border border-[#e5e7eb] overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 border-b border-[#eef1f6]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 bg-[#71f8e4]/20 border border-[#71f8e4] px-4 py-2 rounded-full text-[#006f64] text-sm font-bold">
                  ✦ AI Intelligence Layer
                </div>

                <span className="text-sm font-medium text-slate-400">
                  Refreshed 2m ago
                </span>
              </div>

              <h2 className="mt-6 text-[42px] font-black text-[#173b8f]">
                Tender Analysis
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 p-6">
              <div className="border border-[#e5e7eb] rounded-2xl p-5">
                <p className="text-sm font-bold text-slate-400">
                  Feasibility Score
                </p>

                <div className="mt-4 flex items-center gap-4">
                  <span className="text-[42px] font-black text-[#006f64]">
                    {tender.percentage}%
                  </span>

                  <div className="flex-1 h-3 rounded-full bg-[#dff7f3] overflow-hidden">
                    <div className="w-[85%] h-full bg-[#006f64] rounded-full" />
                  </div>
                </div>
              </div>

              <div className="border border-[#e5e7eb] rounded-2xl p-5">
                <p className="text-sm font-bold text-slate-400">Risk Level</p>

                <div className="mt-4 flex items-center gap-3 text-[#16a34a]">
                  <span className="text-[42px] font-black">Low</span>
                  <ShieldCheck className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="px-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[24px] font-bold text-[#173b8f]">
                  Capability Alignment
                </h3>

                <span className="text-sm font-semibold text-slate-400">
                  3 of 4 Found
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border border-[#e5e7eb] rounded-2xl p-5">
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="h-6 w-6 text-[#22c55e]" />

                    <span className="text-lg font-semibold text-slate-700">
                      Cloud Migration
                    </span>
                  </div>

                  <span className="text-xs uppercase font-bold text-[#22c55e]">
                    Requirement Met
                  </span>
                </div>

                <div className="flex items-center justify-between border border-[#e5e7eb] rounded-2xl p-5">
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="h-6 w-6 text-[#22c55e]" />

                    <span className="text-lg font-semibold text-slate-700">
                      Post-Migration Support
                    </span>
                  </div>

                  <span className="text-xs uppercase font-bold text-[#22c55e]">
                    Requirement Met
                  </span>
                </div>

                <div className="flex items-center justify-between border border-[#e5e7eb] rounded-2xl p-5">
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="h-6 w-6 text-[#22c55e]" />

                    <span className="text-lg font-semibold text-slate-700">
                      Microservices Auth
                    </span>
                  </div>

                  <span className="text-xs uppercase font-bold text-[#22c55e]">
                    Requirement Met
                  </span>
                </div>

                <div className="flex items-center justify-between border border-[#fecaca] bg-[#fff5f5] rounded-2xl p-5">
                  <div className="flex items-center gap-4">
                    <AlertCircle className="h-6 w-6 text-[#ef4444]" />

                    <span className="text-lg font-semibold text-[#b91c1c]">
                      Security Clearance Level 4
                    </span>
                  </div>

                  <span className="text-xs uppercase font-bold text-[#ef4444]">
                    Missing
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 mt-6">
              <div className="rounded-2xl border border-[#dce4ff] bg-[#edf2ff] p-6">
                <h4 className="text-[24px] font-bold text-[#173b8f]">
                  Executive Summary
                </h4>

                <p className="mt-4 italic text-[18px] leading-[2] text-[#4f5d95]">
                  “This tender presents a high-value opportunity with an 85%
                  technical match. Our proprietary CloudScale framework directly
                  addresses all infrastructure requirements.”
                </p>
              </div>
            </div>

            <div className="mt-auto p-6 space-y-4 border-t border-[#eef1f6]">
              <button className="w-full h-14 rounded-xl bg-[#233f97] text-white font-bold text-lg shadow-lg shadow-blue-900/20 hover:bg-[#173b8f] transition-colors">
                Mark as Viable
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button className="h-14 rounded-xl border border-[#dce2f3] text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
                  Send for Review
                </button>

                <button className="h-14 rounded-xl border border-[#fecaca] text-[#ef4444] font-semibold hover:bg-[#fff5f5] transition-colors">
                  Discard
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

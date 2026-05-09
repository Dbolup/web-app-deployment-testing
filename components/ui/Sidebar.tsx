"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  FileText,
  Settings,
  HelpCircle,
} from "lucide-react";
import { MdOutlineAccountTree } from "react-icons/md";
import { IoIosAdd } from "react-icons/io";

export default function Sidebar() {
  const pathname = usePathname();
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard /> },
    { label: "Discovery", href: "/discovery", icon: <Compass /> },
    { label: "Pipeline", href: "/pipeline", icon: <MdOutlineAccountTree /> },
    { label: "Documents", href: "/documents", icon: <FileText /> },
  ];
  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-gray-200 bg-slate-50 flex flex-col gap-2">
      {/* Top */}
      <div className="p-6">
        <div className="text-xl font-bold text-blue-900 dark:text-white flex items-center gap-2">
          <MdOutlineAccountTree className="text-[#00236f] " />
          TenderFlow AI
        </div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
          Procurement Intel
        </p>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.label} {...item} active={pathname === item.href} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t  border-slate-200">
        <button className="w-full flex items-center justify-center gap-1 bg-[#1E3A8A] text-white py-1 rounded-sm font-semibold mb-4">
          <IoIosAdd />
          New Proposal
        </button>

        <div className="space-y-2 text-sm">
          <NavItem
            icon={<Settings />}
            label="Settings"
            href="/settings"
            active={pathname === "/settings"}
          />
          <NavItem
            icon={<HelpCircle />}
            label="Support"
            href="/support"
            active={pathname === "/support"}
          />
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active = false, href }: any) {
  const content = (
    <div
      className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${active ? "flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 font-semibold border-r-2 border-blue-900 dark:border-blue-400 transition-all duration-200 ease-in-out" : "flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-blue-900 dark:hover:text-blue-300 transition-all duration-200 ease-in-out"}`}
    >
      <div className="text-lg">{icon}</div>
      <div className="font-bold text-lg">{label}</div>
    </div>
  );
  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

"use client";

import Image from "next/image";
import {
  Bell,
  CircleHelp,
  Settings,
  Search,
  User,
  Brain,
  ShieldCheck,
  Workflow,
  LogOut,
  LifeBuoy,
  MoreVertical,
  Plus,
} from "lucide-react";
import {
  MdAccountBalance,
  MdAutoAwesome,
  MdOutlineDescription,
  MdOutlinePsychology,
} from "react-icons/md";
import { IoIosAdd, IoIosClose } from "react-icons/io";
import { useState } from "react";
import { ImPencil } from "react-icons/im";

const teamMembers = [
  {
    initials: "AS",
    name: "Alexander Sterling",
    email: "alex@procureai.com",
    role: "Super Admin",
    status: "Active",
  },
  {
    initials: "MC",
    name: "Maya Chen",
    email: "m.chen@procureai.com",
    role: "Reviewer",
    status: "Active",
  },
  {
    initials: "JR",
    name: "James Rodriguez",
    email: "j.rod@procureai.com",
    role: "Editor",
    status: "Pending",
  },
];

const integrations = [
  {
    title: "GovTender API",
    description: "Direct feed from federal procurement portals.",
    connected: true,
    action: "Configure",
  },
  {
    title: "Confluence API",
    description: "Sync documentation and past bid archives.",
    connected: false,
    action: "Connect",
  },
];

export default function SettingsPage() {
  const [keywords, setKeywords] = useState([
    "ESG Compliance",
    "ISO 27001",
    "Tier 3 Logistics",
  ]);

  const removeKeyword = (tag: string) => {
    setKeywords(keywords.filter((k) => k !== tag));
  };
  return (
    <div className="min-h-screen bg-[#F5F7FC] text-[#0F172A]">
      {/* HEADER */}

      <div className="flex">
        {/* MAIN CONTENT */}
        <main className=" flex-1 p-6">
          <div className=" space-y-8">
            {/* PAGE HEADER */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-[#00236f]">
                Workspace Settings
              </h1>

              <p className="mt-2 text-base font-normal text-[#757682]">
                Manage your institutional preferences, AI model parameters, and
                platform integrations.
              </p>
            </div>

            {/* PROFILE + STORAGE */}
            <section className="grid gap-6 md:grid-cols-3">
              <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Image
                      src="/profilePicture.jpg"
                      alt="profile"
                      width={96}
                      height={96}
                      className="rounded-[0.75rem] object-cover h-24 w-24 border-4 border-[#e7eefe]"
                    />

                    <button className="absolute bottom-0 right-0 rounded-[0.75rem] bg-[#00236f] p-1.5 text-white shadow-sm cursor-pointer border-2 border-white">
                      <span>
                        {" "}
                        <ImPencil className="text-sm" />
                      </span>
                    </button>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold text-[#00236f]">
                      Alexander Sterling
                    </h3>

                    <p className="mt-1 text-sm text-[#757682]">
                      Lead Procurement Officer
                    </p>

                    <div className="mt-4 inline-flex rounded-full bg-[#00236f]/10 px-4 py-1 text-[12px] font-semibold text-[#00236f]">
                      Admin Access
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-[#757682]">
                  Storage Usage
                </p>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-3/4 bg-[#006b5f]" />
                </div>

                <p className="mt-3 text-sm text-[#757682]">75% of 10GB used</p>

                <button className="mt-4 font-semibold text-[#006b5f] cursor-pointer">
                  Upgrade Plan →
                </button>
              </div>
            </section>

            {/* AI TUNING */}
            <section className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3 ">
                  <MdOutlinePsychology className="text-[#006b5f]" size={22} />

                  <h2 className="text-2xl font-bold text-[#00236f]">
                    AI Tuning & Sensitivity
                  </h2>
                </div>

                <div className="rounded-full bg-[#006b5f]/10 px-4 py-1 text-sm font-semibold text-[#006b5f] flex gap-2 items-center">
                  <MdAutoAwesome size={16} className="inline-block " /> AI
                  Powered
                </div>
              </div>

              <div className="space-y-8 p-6">
                <div>
                  <label className="mb-4 block font-semibold text-[#00236f]">
                    Model Sensitivity
                  </label>

                  <input
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00236f]"
                    max="100"
                    min="1"
                    type="range"
                    defaultValue={65}
                  />

                  <div className="mt-4 flex justify-between text-sm text-[#757682]">
                    {/* <span>Strict</span>
                    <span>Balanced</span>
                    <span>Broad</span> */}
                    <div className="text-center">
                      <p className="font-bold text-[#00236f]">Strict</p>
                      <p>Exact matches only</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">Balanced</p>
                      <p>Standard detection</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-[#00236f]">Broad</p>
                      <p>Semantic associations</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-4 block font-semibold text-[#00236f]">
                    Keyword Tuning
                  </label>

                  <div className="flex flex-wrap gap-3">
                    {keywords.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => removeKeyword(tag)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm cursor-pointer flex items-center gap-2"
                      >
                        {tag} <IoIosClose className="text-slate-500 h-6 w-6" />
                      </button>
                    ))}

                    <button className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-[#757682] cursor-pointer">
                      <IoIosAdd className="text-slate-500 h-4 w-4" />
                      Add Term
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* INTEGRATIONS */}
            <section>
              <h2 className="mb-5 text-2xl font-bold text-[#00236f]">
                Platform Integrations
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                {integrations.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xs bg-[#e7eefe]">
                        {item.connected ? (
                          <MdAccountBalance
                            size={22}
                            className="text-[#00236f]"
                          />
                        ) : (
                          <MdOutlineDescription
                            size={22}
                            className="text-[#00236f]"
                          />
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold text-[#00236f]">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-sm text-[#757682]">
                          {item.description}
                        </p>

                        <p
                          className={`mt-4 text-sm font-bold ${
                            item.connected ? "text-[#006b5f]" : "text-slate-400"
                          }`}
                        >
                          ● {item.connected ? "Connected" : "Disconnected"}
                        </p>
                      </div>
                    </div>

                    <button
                      className={`px-4 py-2 font-medium cursor-pointer rounded-lg hover:opacity-90 transition-colors ${
                        item.connected
                          ? "border border-[#006b5f] text-[#006b5f]"
                          : "bg-[#00236f] text-white"
                      }`}
                    >
                      {item.action}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* TEAM MEMBERS */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <h2 className="text-2xl font-bold text-[#00236f]">
                  Team Members
                </h2>

                <button className="flex items-center gap-2 rounded-lg bg-[#00236f] px-4 py-2 text-white cursor-pointer">
                  <Plus size={16} />
                  Invite User
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="px-6 py-3 text-[#00236f] font-semibold">
                        Member
                      </th>
                      <th className="px-6 py-3 text-[#00236f] font-semibold">
                        Role
                      </th>
                      <th className="px-6 py-3 text-[#00236f] font-semibold">
                        Status
                      </th>
                      <th className="px-6 py-3 text-[#00236f] font-semibold text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {teamMembers.map((member) => (
                      <tr
                        key={member.email}
                        className="border-t border-slate-100"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {member.role === "Super Admin" && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-[0.75rem] bg-[#1e3a8a] text-xs font-bold text-white">
                                {member.initials}
                              </div>
                            )}
                            {member.role === "Reviewer" && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-[0.75rem] bg-[#6df5e1] text-xs font-bold text-[#006b5f]">
                                {member.initials}
                              </div>
                            )}
                            {member.role === "Editor" && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-[0.75rem] bg-[#e7eefe] text-xs font-bold text-[#757682]">
                                {member.initials}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-[#00236f] text-sm">
                                {member.name}
                              </p>

                              <p className="text-xs text-[#757682]">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4  ">
                          <span
                            className={`${member.role === "Super Admin" ? "text-[#00236f] bg-[#00236f]/5 text-[12px] px-2 py-0.5 rounded font-semibold" : "text-[#757682] bg-[#757682]/5 text-[12px] px-2 py-0.5 rounded font-semibold"}`}
                          >
                            {member.role}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`font-medium ${
                              member.status === "Active"
                                ? "text-[#006b5f] text-sm font-semibold"
                                : "text-[#757682] text-sm font-semibold opacity-50"
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <button>
                              <MoreVertical
                                size={18}
                                className="text-[#757682] cursor-pointer hover:text-[#00236f] transition-colors"
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* DANGER ZONE */}
            <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[#ba1a1a]">
                    Delete Workspace
                  </h3>

                  <p className="mt-1 text-sm text-[#757682]">
                    Permanently remove all data, AI tunings, and user access.
                  </p>
                </div>

                <button className="border border-[#ba1a1a] px-5 py-2 text-sm font-semibold text-[#ba1a1a] cursor-pointer rounded-lg hover:bg-error/5 transition-colors">
                  Delete Workspace
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

{
  /* "colors": {
                        "on-secondary-fixed": "#00201c",
                        "inverse-primary": "#b6c4ff",
                        "on-secondary": "#ffffff",
                        "error": "#ba1a1a",
                        "tertiary": "#3e2400",
                        "surface-container-lowest": "#ffffff",
                        "tertiary-fixed": "#ffddb8",
                        "surface-variant": "#dce2f3",
                        "surface-container-highest": "#dce2f3",
                        "primary-fixed": "#dce1ff",
                        "surface-dim": "#d3daea",
                        "inverse-on-surface": "#ebf1ff",
                        "on-primary-fixed-variant": "#264191",
                        "on-tertiary-fixed-variant": "#653e00",
                        "on-tertiary-fixed": "#2a1700",
                        "on-primary-fixed": "#00164e",
                        "on-surface": "#151c27",
                        "primary-fixed-dim": "#b6c4ff",
                        "on-tertiary-container": "#ef9900",
                        "on-primary": "#ffffff",
                        "secondary-container": "#6df5e1",
                        "surface-container-low": "#f0f3ff",
                        "surface": "#f9f9ff",
                        "outline": "#757682",
                        "on-tertiary": "#ffffff",
                        "on-secondary-container": "#006f64",
                        "background": "#f9f9ff",
                        "surface-tint": "#4059aa",
                        "on-error-container": "#93000a",
                        "tertiary-fixed-dim": "#ffb95f",
                        "surface-bright": "#f9f9ff",
                        "surface-container": "#e7eefe",
                        "inverse-surface": "#2a313d",
                        "error-container": "#ffdad6",
                        "surface-container-high": "#e2e8f8",
                        "secondary-fixed-dim": "#4fdbc8",
                        "on-surface-variant": "#444651",
                        "primary": "#00236f",
                        "on-primary-container": "#90a8ff",
                        "on-error": "#ffffff",
                        "tertiary-container": "#5c3800",
                        "secondary": "#006b5f",
                        "secondary-fixed": "#71f8e4",
                        "primary-container": "#1e3a8a",
                        "on-secondary-fixed-variant": "#005048",
                        "outline-variant": "#c5c5d3",
                        "on-background": "#151c27" */
}

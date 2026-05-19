"use client";

import { useEffect, useState, useRef } from "react";
import {
  MdOutlinePsychology,
  MdAutoAwesome,
  MdAccountBalance,
  MdOutlineDescription,
} from "react-icons/md";
import { IoIosAdd, IoIosClose } from "react-icons/io";
import { ImPencil } from "react-icons/im";
import { MoreVertical, Plus, Loader2, Check, X, KeyRound } from "lucide-react";
import {
  getMe, updateMe,
  getWorkspace, updateWorkspace,
  getTeamMembers, inviteUser, removeTeamMember,
  getPendingInvitations, cancelInvitation,
  getIntegrations, disconnectIntegration,
  changePassword, clearTokens,
  getCompanyProfile, saveCompanyProfile,
  UserProfile, WorkspaceSettings, TeamMember, PendingInvitation, Integration, CompanyProfilePayload,
} from "@/lib/api";
import { useRouter } from "next/navigation";

// ─── tiny helpers ─────────────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function SaveButton({ state, onClick, label = "Save changes" }: { state: SaveState; onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={state === 'saving'}
      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50
        bg-[#00236f] text-white hover:bg-[#1e3a8a]"
    >
      {state === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {state === 'saved' && <Check className="h-3.5 w-3.5" />}
      {state === 'error' && <X className="h-3.5 w-3.5" />}
      {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved!' : state === 'error' ? 'Error' : label}
    </button>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />;
}

const SENSITIVITY_VALUES = { strict: 16, balanced: 50, broad: 84 } as const;
const SENSITIVITY_FROM_SLIDER = (v: number) => v < 34 ? 'strict' : v > 66 ? 'broad' : 'balanced';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', reviewer: 'Reviewer', member: 'Member',
  super_admin: 'Admin', editor: 'Member',
};
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-[#1e3a8a] text-white',
  super_admin: 'bg-[#1e3a8a] text-white',
  reviewer: 'bg-[#6df5e1] text-[#006b5f]',
  member: 'bg-[#e7eefe] text-[#757682]',
  editor: 'bg-[#e7eefe] text-[#757682]',
};
const STATUS_BADGE: Record<string, string> = {
  active: 'text-[#006b5f] font-semibold',
  pending: 'text-slate-400 font-semibold',
};
const INTEGRATION_ICONS: Record<string, React.ReactNode> = {
  gov_tender: <MdAccountBalance size={22} className="text-[#00236f]" />,
  confluence: <MdOutlineDescription size={22} className="text-[#00236f]" />,
  slack: <MdOutlineDescription size={22} className="text-[#00236f]" />,
  teams: <MdOutlineDescription size={22} className="text-[#00236f]" />,
  other: <MdOutlineDescription size={22} className="text-[#00236f]" />,
};

// ─── Company profile helpers ───────────────────────────────────────────────────

const SECTORS_OPTIONS = [
  "Information Technology", "Healthcare", "Construction & Infrastructure",
  "Professional Services", "Defence & Security", "Transport",
  "Education", "Energy & Environment", "Finance", "Legal Services",
];

const NOTICE_TYPE_OPTIONS = [
  { value: "tender", label: "Tender" },
  { value: "award", label: "Award Notice" },
  { value: "planning", label: "Prior Information Notice" },
  { value: "contract", label: "Contract" },
];

const COMMON_CAPABILITIES = [
  "Cloud Migration", "DevOps", "Cyber Security", "Data Engineering",
  "Software Development", "Project Management", "Business Analysis",
  "AI / Machine Learning", "Infrastructure", "Digital Transformation",
];

const COMMON_CERTS = [
  "ISO 27001", "ISO 9001", "Cyber Essentials Plus", "G-Cloud",
  "BPSS", "SC Clearance", "DV Clearance",
];

function TagInput({
  label, hint, items, suggestions, onChange, placeholder,
}: {
  label: string; hint?: string; items: string[];
  suggestions?: string[]; onChange: (items: string[]) => void; placeholder: string;
}) {
  const [input, setInput] = useState("");

  function add(value: string) {
    const v = value.trim();
    if (v && !items.includes(v)) onChange([...items, v]);
    setInput("");
  }

  const unused = suggestions?.filter((s) => !items.includes(s)) ?? [];

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}
      <div className="min-h-[48px] w-full px-3 py-2 border border-slate-200 rounded-xl bg-white flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-[#00236f]/20 focus-within:border-[#00236f] transition-all">
        {items.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1e3a8a]/10 text-[#1e3a8a] text-xs font-semibold rounded-lg border border-[#1e3a8a]/20">
            {tag}
            <button type="button" onClick={() => onChange(items.filter((i) => i !== tag))} className="hover:text-red-500 transition-colors">
              <IoIosClose className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); }
            else if (e.key === "Backspace" && !input && items.length > 0) onChange(items.slice(0, -1));
          }}
          onBlur={() => input.trim() && add(input)}
          placeholder={items.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
        />
      </div>
      {unused.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unused.map((s) => (
            <button key={s} type="button" onClick={() => onChange([...items, s])}
              className="px-2.5 py-1 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-[#1e3a8a]/10 hover:text-[#1e3a8a] rounded-lg border border-slate-200 transition-colors">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToggleChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${selected ? "bg-[#00236f] text-white border-[#00236f] shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-[#00236f]/40 hover:text-[#00236f]"}`}>
      {selected && <Check className="h-3 w-3 inline mr-1.5 mb-0.5" />}
      {label}
    </button>
  );
}

function fmtContract(val: string | number | null): string {
  const n = typeof val === 'string' ? Number(val) : val;
  if (!n || isNaN(n)) return "";
  return n >= 1_000_000 ? `£${(n / 1_000_000).toFixed(1)}M` : `£${(n / 1_000).toFixed(0)}k`;
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();

  // Remote data
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvitation[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loadError, setLoadError] = useState("");

  // Local editable state
  const [sensitivity, setSensitivity] = useState(50);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");

  // Company profile editable state
  const [cpName, setCpName] = useState("");
  const [cpDescription, setCpDescription] = useState("");
  const [cpCapabilities, setCpCapabilities] = useState<string[]>([]);
  const [cpCertifications, setCpCertifications] = useState<string[]>([]);
  const [cpSectors, setCpSectors] = useState<string[]>([]);
  const [cpContractMin, setCpContractMin] = useState("");
  const [cpContractMax, setCpContractMax] = useState("");
  const [cpExcludedKeywords, setCpExcludedKeywords] = useState<string[]>([]);
  const [cpPreferredNoticeTypes, setCpPreferredNoticeTypes] = useState<string[]>([]);
  const [cpOnboardingCompleted, setCpOnboardingCompleted] = useState(false);
  const [cpExists, setCpExists] = useState(false);

  // Save states
  const [aiSave, setAiSave] = useState<SaveState>('idle');
  const [profileSave, setProfileSave] = useState<SaveState>('idle');
  const [cpSave, setCpSave] = useState<SaveState>('idle');

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteSave, setInviteSave] = useState<SaveState>('idle');

  // Password modal
  const [showPwd, setShowPwd] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdSave, setPwdSave] = useState<SaveState>('idle');
  const [pwdError, setPwdError] = useState("");

  // Member action dropdown
  const [openMemberMenu, setOpenMemberMenu] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Load all data ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getMe(), getWorkspace(), getTeamMembers(), getPendingInvitations(), getIntegrations(), getCompanyProfile()])
      .then(([u, ws, team, invites, intgs, cp]) => {
        setUser(u);
        setWorkspace(ws);
        setWorkspaceName(ws.name);
        setSensitivity(SENSITIVITY_VALUES[ws.ai_sensitivity]);
        setKeywords(ws.keywords ?? []);
        setMembers(team);
        setPendingInvites(invites);
        setIntegrations(intgs);
        if (cp) {
          setCpExists(true);
          setCpName(cp.company_name);
          setCpDescription(cp.description);
          setCpCapabilities(cp.capabilities ?? []);
          setCpCertifications(cp.certifications ?? []);
          setCpSectors(cp.sectors ?? []);
          setCpContractMin(cp.typical_contract_min != null ? String(cp.typical_contract_min) : "");
          setCpContractMax(cp.typical_contract_max != null ? String(cp.typical_contract_max) : "");
          setCpExcludedKeywords(cp.excluded_keywords ?? []);
          setCpPreferredNoticeTypes(cp.preferred_notice_types ?? []);
          setCpOnboardingCompleted(cp.onboarding_completed);
        }
      })
      .catch(() => setLoadError("Failed to load settings. Please refresh."));
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMemberMenu(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  async function flash(set: (s: SaveState) => void, fn: () => Promise<void>) {
    set('saving');
    try {
      await fn();
      set('saved');
      setTimeout(() => set('idle'), 2000);
    } catch {
      set('error');
      setTimeout(() => set('idle'), 2500);
    }
  }

  function addKeyword() {
    const v = newKeyword.trim();
    if (v && !keywords.includes(v)) setKeywords([...keywords, v]);
    setNewKeyword("");
  }

  async function saveAI() {
    flash(setAiSave, async () => {
      const ws = await updateWorkspace({
        name: workspaceName,
        ai_sensitivity: SENSITIVITY_FROM_SLIDER(sensitivity),
        keywords,
      });
      setWorkspace(ws);
    });
  }

  async function handleSaveCompanyProfile() {
    flash(setCpSave, async () => {
      await saveCompanyProfile({
        company_name: cpName,
        description: cpDescription,
        capabilities: cpCapabilities,
        certifications: cpCertifications,
        sectors: cpSectors,
        typical_contract_min: cpContractMin ? Number(cpContractMin) : null,
        typical_contract_max: cpContractMax ? Number(cpContractMax) : null,
        excluded_keywords: cpExcludedKeywords,
        preferred_notice_types: cpPreferredNoticeTypes,
        onboarding_completed: cpOnboardingCompleted || true,
      });
      setCpExists(true);
    });
  }

  async function handleInvite() {
    flash(setInviteSave, async () => {
      await inviteUser(inviteEmail, inviteRole);
      const [team, invites] = await Promise.all([getTeamMembers(), getPendingInvitations()]);
      setMembers(team);
      setPendingInvites(invites);
      setShowInvite(false);
      setInviteEmail("");
    });
  }

  async function handleCancelInvite(id: number) {
    try {
      await cancelInvitation(id);
      setPendingInvites(prev => prev.filter(i => i.id !== id));
    } catch { /* ignore */ }
  }

  async function handleRemoveMember(id: number) {
    try {
      await removeTeamMember(id);
      setMembers(members.filter(m => m.id !== id));
    } catch { /* ignore */ }
    setOpenMemberMenu(null);
  }

  async function handleDisconnect(id: number) {
    try {
      await disconnectIntegration(id);
      setIntegrations(intgs => intgs.map(i => i.id === id ? { ...i, status: 'disconnected' as const } : i));
    } catch { /* ignore */ }
  }

  async function handleChangePassword() {
    setPwdError("");
    if (newPwd !== confirmPwd) { setPwdError("Passwords do not match"); return; }
    if (newPwd.length < 8) { setPwdError("At least 8 characters required"); return; }
    flash(setPwdSave, async () => {
      await changePassword(oldPwd, newPwd);
      setShowPwd(false);
      setOldPwd(""); setNewPwd(""); setConfirmPwd("");
    });
  }

  function handleSignOut() {
    clearTokens();
    router.replace("/login");
  }

  const storagePercent = workspace?.storage_used_percent ?? 0;
  const storageUsedMB = workspace ? (workspace.storage_used / 1024 / 1024).toFixed(0) : '—';
  const storageLimitGB = workspace ? (workspace.storage_limit / 1024 / 1024 / 1024).toFixed(0) : '—';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F7FC] text-[#0F172A] pb-20">
      <main className="max-w-5xl mx-auto p-6 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-[#00236f]">Workspace Settings</h1>
          <p className="mt-2 text-base text-[#757682]">
            Manage your institutional preferences, AI model parameters, and platform integrations.
          </p>
          {loadError && (
            <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {loadError}
            </div>
          )}
        </div>

        {/* PROFILE + STORAGE */}
        <section className="grid gap-6 md:grid-cols-3">
          {/* Profile card */}
          <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-6">
              <div className="relative shrink-0">
                <div className="h-24 w-24 rounded-[0.75rem] bg-[#e7eefe] border-4 border-[#e7eefe] flex items-center justify-center text-3xl font-black text-[#00236f]">
                  {user ? `${user.first_name[0]}${user.last_name[0]}` : ''}
                </div>
                <button className="absolute bottom-0 right-0 rounded-[0.75rem] bg-[#00236f] p-1.5 text-white shadow-sm border-2 border-white">
                  <ImPencil className="text-sm" />
                </button>
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                {!user ? (
                  <>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-semibold text-[#00236f]">{user.full_name}</h3>
                    <p className="text-sm text-[#757682]">{user.email}</p>
                    <div className="inline-flex rounded-full bg-[#00236f]/10 px-4 py-1 text-[12px] font-semibold text-[#00236f]">
                      {ROLE_LABEL[user.role] ?? user.role}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Workspace name */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Workspace name
                </label>
                {!workspace ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <input
                    value={workspaceName}
                    onChange={e => setWorkspaceName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] outline-none"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPwd(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:border-[#00236f]/40 hover:text-[#00236f] transition-colors"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Change password
                </button>
                <SaveButton state={profileSave} onClick={() => flash(setProfileSave, async () => {
                  const ws = await updateWorkspace({ name: workspaceName });
                  setWorkspace(ws);
                  setWorkspaceName(ws.name);
                })} />
              </div>
            </div>
          </div>

          {/* Storage */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#757682]">
              Storage Usage
            </p>
            {!workspace ? (
              <>
                <Skeleton className="h-2 w-full mt-5" />
                <Skeleton className="h-4 w-32 mt-3" />
              </>
            ) : (
              <>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${storagePercent > 80 ? 'bg-red-500' : 'bg-[#006b5f]'}`}
                    style={{ width: `${Math.min(storagePercent, 100)}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-[#757682]">
                  {storagePercent.toFixed(0)}% — {storageUsedMB} MB of {storageLimitGB} GB used
                </p>
              </>
            )}
            <button className="mt-auto pt-4 font-semibold text-[#006b5f] text-sm hover:underline text-left">
              Upgrade Plan →
            </button>
          </div>
        </section>

        {/* COMPANY PROFILE */}
        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <MdAutoAwesome className="text-[#006b5f]" size={22} />
              <div>
                <h2 className="text-2xl font-bold text-[#00236f]">Company Profile</h2>
                <p className="text-xs text-slate-400 mt-0.5">Used by AI to match and score tenders</p>
              </div>
            </div>
            {!cpExists && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                Not set up yet
              </span>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Company name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Company / organisation name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cpName}
                onChange={e => setCpName(e.target.value)}
                placeholder="Acme Digital Services Ltd"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                What does your company do? <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={cpDescription}
                onChange={e => setCpDescription(e.target.value)}
                placeholder="We are a technology consultancy specialising in cloud migration and digital transformation..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] outline-none resize-none"
              />
            </div>

            {/* Sectors */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Primary sectors</label>
              <p className="text-xs text-slate-400 mb-3">Select all sectors you actively bid in</p>
              <div className="flex flex-wrap gap-2">
                {SECTORS_OPTIONS.map(s => (
                  <ToggleChip
                    key={s} label={s}
                    selected={cpSectors.includes(s)}
                    onClick={() => setCpSectors(prev =>
                      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Capabilities */}
            <TagInput
              label="Capabilities"
              hint="What can your team deliver? Press Enter or comma to add."
              items={cpCapabilities}
              suggestions={COMMON_CAPABILITIES}
              onChange={setCpCapabilities}
              placeholder="e.g. Cloud Migration, DevOps, Cyber Security…"
            />

            {/* Certifications */}
            <TagInput
              label="Certifications & accreditations"
              hint="Any held certifications that strengthen bids"
              items={cpCertifications}
              suggestions={COMMON_CERTS}
              onChange={setCpCertifications}
              placeholder="e.g. ISO 27001, Cyber Essentials Plus…"
            />

            {/* Contract range */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Typical contract value range
              </label>
              <p className="text-xs text-slate-400 mb-3">Helps the AI filter tenders that are too small or too large</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Minimum (£)</label>
                  <input
                    type="number" min="0"
                    value={cpContractMin}
                    onChange={e => setCpContractMin(e.target.value)}
                    placeholder="50000"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] outline-none"
                  />
                  {cpContractMin && <p className="text-xs text-[#006b5f] mt-1 font-medium">{fmtContract(cpContractMin)}</p>}
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Maximum (£)</label>
                  <input
                    type="number" min="0"
                    value={cpContractMax}
                    onChange={e => setCpContractMax(e.target.value)}
                    placeholder="2000000"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] outline-none"
                  />
                  {cpContractMax && <p className="text-xs text-[#006b5f] mt-1 font-medium">{fmtContract(cpContractMax)}</p>}
                </div>
              </div>
            </div>

            {/* Preferred notice types */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Preferred notice types</label>
              <div className="flex flex-wrap gap-2">
                {NOTICE_TYPE_OPTIONS.map(({ value, label }) => (
                  <ToggleChip
                    key={value} label={label}
                    selected={cpPreferredNoticeTypes.includes(value)}
                    onClick={() => setCpPreferredNoticeTypes(prev =>
                      prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Excluded keywords */}
            <TagInput
              label="Excluded keywords"
              hint="Tenders containing these words will be down-ranked by the AI"
              items={cpExcludedKeywords}
              onChange={setCpExcludedKeywords}
              placeholder="e.g. Nuclear, Overseas, Legal…"
            />

            <div className="flex justify-end pt-2">
              <SaveButton
                state={cpSave}
                onClick={handleSaveCompanyProfile}
                label={cpExists ? "Save changes" : "Save profile"}
              />
            </div>
          </div>
        </section>

        {/* AI TUNING */}
        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <MdOutlinePsychology className="text-[#006b5f]" size={22} />
              <h2 className="text-2xl font-bold text-[#00236f]">AI Tuning & Sensitivity</h2>
            </div>
            <div className="rounded-full bg-[#006b5f]/10 px-4 py-1 text-sm font-semibold text-[#006b5f] flex gap-2 items-center">
              <MdAutoAwesome size={16} />
              AI Powered
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Sensitivity slider */}
            <div>
              <label className="mb-4 block font-semibold text-[#00236f]">Model Sensitivity</label>
              {!workspace ? (
                <Skeleton className="h-2 w-full" />
              ) : (
                <>
                  <input
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00236f]"
                    max="100" min="1" type="range"
                    value={sensitivity}
                    onChange={e => setSensitivity(Number(e.target.value))}
                  />
                  <div className="mt-4 grid grid-cols-3 text-sm text-[#757682]">
                    <div className={`text-left ${sensitivity < 34 ? 'font-bold text-[#00236f]' : ''}`}>
                      <p className="font-bold">Strict</p>
                      <p className="text-xs">Exact matches only</p>
                    </div>
                    <div className={`text-center ${sensitivity >= 34 && sensitivity <= 66 ? 'font-bold text-[#00236f]' : ''}`}>
                      <p className="font-bold">Balanced</p>
                      <p className="text-xs">Standard detection</p>
                    </div>
                    <div className={`text-right ${sensitivity > 66 ? 'font-bold text-[#00236f]' : ''}`}>
                      <p className="font-bold">Broad</p>
                      <p className="text-xs">Semantic associations</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Keywords */}
            <div>
              <label className="mb-4 block font-semibold text-[#00236f]">Keyword Tuning</label>
              <div className="flex flex-wrap gap-3">
                {keywords.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setKeywords(keywords.filter(k => k !== tag))}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm cursor-pointer flex items-center gap-2 hover:border-red-200 hover:bg-red-50 transition-colors"
                  >
                    {tag}
                    <IoIosClose className="text-slate-500 h-5 w-5" />
                  </button>
                ))}
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-1.5">
                  <input
                    value={newKeyword}
                    onChange={e => setNewKeyword(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                    placeholder="Add keyword…"
                    className="text-sm outline-none bg-transparent w-28 text-[#757682]"
                  />
                  <button onClick={addKeyword} className="text-slate-400 hover:text-[#00236f]">
                    <IoIosAdd className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <SaveButton state={aiSave} onClick={saveAI} />
            </div>
          </div>
        </section>

        {/* INTEGRATIONS */}
        <section>
          <h2 className="mb-5 text-2xl font-bold text-[#00236f]">Platform Integrations</h2>
          {integrations.length === 0 && !loadError ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map(i => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <Skeleton className="h-12 w-12" />
                  <Skeleton className="h-4 w-32 mt-4" />
                  <Skeleton className="h-3 w-48 mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {integrations.map(item => (
                <div key={item.id} className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e7eefe] shrink-0">
                      {INTEGRATION_ICONS[item.integration_type] ?? INTEGRATION_ICONS.other}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#00236f]">{item.name}</h3>
                      <p className="mt-1 text-sm text-[#757682] capitalize">{item.integration_type.replace('_', ' ')}</p>
                      <p className={`mt-3 text-sm font-bold ${item.status === 'connected' ? 'text-[#006b5f]' : 'text-slate-400'}`}>
                        ● {item.status === 'connected' ? 'Connected' : 'Disconnected'}
                      </p>
                    </div>
                  </div>
                  {item.status === 'connected' ? (
                    <button
                      onClick={() => handleDisconnect(item.id)}
                      className="px-4 py-2 text-sm font-semibold border border-slate-300 text-slate-600 rounded-xl hover:border-red-200 hover:text-red-600 transition-colors"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button className="px-4 py-2 text-sm font-semibold bg-[#00236f] text-white rounded-xl hover:bg-[#1e3a8a] transition-colors">
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* TEAM MEMBERS */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <h2 className="text-2xl font-bold text-[#00236f]">Team Members</h2>
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 rounded-xl bg-[#00236f] px-4 py-2 text-white text-sm font-bold hover:bg-[#1e3a8a] transition-colors"
            >
              <Plus size={16} />
              Invite User
            </button>
          </div>
          <div className="overflow-x-auto" ref={menuRef}>
            <table className="w-full">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-6 py-3 text-[#00236f] font-semibold text-sm">Member</th>
                  <th className="px-6 py-3 text-[#00236f] font-semibold text-sm">Role</th>
                  <th className="px-6 py-3 text-[#00236f] font-semibold text-sm">Status</th>
                  <th className="px-6 py-3 text-right" />
                </tr>
              </thead>
              <tbody>
                {members.length === 0 && pendingInvites.length === 0 && !loadError
                  ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-6 py-4" />
                    </tr>
                  ))
                  : <>
                    {members.map(member => (
                      <tr key={member.id} className="border-t border-slate-100">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold shrink-0 ${ROLE_COLORS[member.role] ?? 'bg-slate-100 text-slate-600'}`}>
                              {member.user.first_name[0]}{member.user.last_name[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-[#00236f] text-sm">{member.user.full_name}</p>
                              <p className="text-xs text-[#757682]">{member.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[12px] px-2 py-0.5 rounded font-semibold ${ROLE_COLORS[member.role] ?? 'bg-slate-100 text-slate-500'}`}>
                            {ROLE_LABEL[member.role] ?? member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm capitalize ${STATUS_BADGE[member.status] ?? ''}`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end relative">
                            <button
                              onClick={() => setOpenMemberMenu(openMemberMenu === member.id ? null : member.id)}
                              className="text-[#757682] hover:text-[#00236f] transition-colors"
                            >
                              <MoreVertical size={18} />
                            </button>
                            {openMemberMenu === member.id && (
                              <div className="absolute right-0 top-8 z-20 w-40 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                                <button
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  Remove member
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingInvites.map(invite => (
                      <tr key={`inv-${invite.id}`} className="border-t border-slate-100 bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold shrink-0 bg-slate-100 text-slate-400">
                              ?
                            </div>
                            <div>
                              <p className="font-semibold text-slate-500 text-sm">{invite.email}</p>
                              <p className="text-xs text-slate-400">Invitation pending</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[12px] px-2 py-0.5 rounded font-semibold ${ROLE_COLORS[invite.role] ?? 'bg-slate-100 text-slate-500'}`}>
                            {ROLE_LABEL[invite.role] ?? invite.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-amber-500 font-semibold">Invited</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleCancelInvite(invite.id)}
                              className="text-xs text-slate-400 hover:text-red-600 transition-colors font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                }
              </tbody>
            </table>
          </div>
        </section>

        {/* DANGER ZONE */}
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-[#ba1a1a]">Danger Zone</h3>
              <p className="mt-1 text-sm text-[#757682]">
                Sign out of your account or permanently delete this workspace.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSignOut}
                className="px-5 py-2 text-sm font-semibold text-slate-600 border border-slate-300 rounded-xl hover:border-slate-400 transition-colors"
              >
                Sign out
              </button>
              <button className="border border-[#ba1a1a] px-5 py-2 text-sm font-semibold text-[#ba1a1a] rounded-xl hover:bg-red-100 transition-colors">
                Delete Workspace
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Invite modal ─────────────────────────────────────────────────────── */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#00236f]">Invite team member</h3>
              <button onClick={() => setShowInvite(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] outline-none"
                >
                  <option value="member">Member</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInvite(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail || inviteSave === 'saving'}
                className="flex-1 py-2.5 bg-[#00236f] text-white rounded-xl text-sm font-bold hover:bg-[#1e3a8a] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {inviteSave === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {inviteSave === 'saving' ? 'Sending…' : 'Send invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change password modal ─────────────────────────────────────────────── */}
      {showPwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#00236f]">Change password</h3>
              <button onClick={() => setShowPwd(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {pwdError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {pwdError}
              </div>
            )}
            <div className="space-y-4">
              {([
                ['Current password', oldPwd, setOldPwd, 'current-password'],
                ['New password', newPwd, setNewPwd, 'new-password'],
                ['Confirm new password', confirmPwd, setConfirmPwd, 'new-password'],
              ] as [string, string, (v: string) => void, string][]).map(([label, value, setter, ac]) => (
                <div key={label}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                  <input
                    type="password"
                    autoComplete={ac}
                    value={value}
                    onChange={e => { setter(e.target.value); setPwdError(""); }}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPwd(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={pwdSave === 'saving'}
                className="flex-1 py-2.5 bg-[#00236f] text-white rounded-xl text-sm font-bold hover:bg-[#1e3a8a] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pwdSave === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {pwdSave === 'saving' ? 'Saving…' : pwdSave === 'saved' ? 'Saved!' : 'Update password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

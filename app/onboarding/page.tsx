"use client";
import { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { MdOutlineAccountTree } from "react-icons/md";
import { IoIosClose } from "react-icons/io";
import { ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";
import { saveCompanyProfile, getAccessToken } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileState {
  company_name: string;
  description: string;
  capabilities: string[];
  certifications: string[];
  sectors: string[];
  typical_contract_min: string;
  typical_contract_max: string;
  excluded_keywords: string[];
  preferred_notice_types: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 3;

const SECTORS_OPTIONS = [
  "Information Technology",
  "Healthcare",
  "Construction & Infrastructure",
  "Professional Services",
  "Defence & Security",
  "Transport",
  "Education",
  "Energy & Environment",
  "Finance",
  "Legal Services",
];

const NOTICE_TYPE_OPTIONS = [
  { value: "tender", label: "Tender" },
  { value: "award", label: "Award Notice" },
  { value: "planning", label: "Prior Information Notice" },
  { value: "contract", label: "Contract" },
];

const COMMON_CAPABILITIES = [
  "Cloud Migration",
  "DevOps",
  "Cyber Security",
  "Data Engineering",
  "Software Development",
  "Project Management",
  "Business Analysis",
  "AI / Machine Learning",
  "Infrastructure",
  "Digital Transformation",
];

const COMMON_CERTS = [
  "ISO 27001",
  "ISO 9001",
  "Cyber Essentials Plus",
  "G-Cloud",
  "BPSS",
  "SC Clearance",
  "DV Clearance",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function TagInput({
  label,
  hint,
  items,
  suggestions,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  items: string[];
  suggestions?: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  function add(value: string) {
    const v = value.trim();
    if (v && !items.includes(v)) onChange([...items, v]);
    setInput("");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && items.length > 0) {
      onChange(items.slice(0, -1));
    }
  }

  const unused = suggestions?.filter((s) => !items.includes(s)) ?? [];

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label}
      </label>
      {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}

      <div className="min-h-[52px] w-full px-3 py-2 border border-slate-200 rounded-xl bg-white flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-[#00236f]/20 focus-within:border-[#00236f] transition-all">
        {items.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1e3a8a]/10 text-[#1e3a8a] text-xs font-semibold rounded-lg border border-[#1e3a8a]/20"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(items.filter((i) => i !== tag))}
              className="hover:text-red-500 transition-colors"
            >
              <IoIosClose className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => input.trim() && add(input)}
          placeholder={items.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
        />
      </div>

      {unused.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unused.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange([...items, s])}
              className="px-2.5 py-1 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-[#1e3a8a]/10 hover:text-[#1e3a8a] rounded-lg border border-slate-200 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
        selected
          ? "bg-[#00236f] text-white border-[#00236f] shadow-sm"
          : "bg-white text-slate-600 border-slate-200 hover:border-[#00236f]/40 hover:text-[#00236f]"
      }`}
    >
      {selected && <Check className="h-3 w-3 inline mr-1.5 mb-0.5" />}
      {label}
    </button>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({
  profile,
  setProfile,
}: {
  profile: ProfileState;
  setProfile: React.Dispatch<React.SetStateAction<ProfileState>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Company / organisation name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={profile.company_name}
          onChange={(e) =>
            setProfile((p) => ({ ...p, company_name: e.target.value }))
          }
          placeholder="Acme Digital Services Ltd"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] outline-none transition-all bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          What does your company do? <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={4}
          value={profile.description}
          onChange={(e) =>
            setProfile((p) => ({ ...p, description: e.target.value }))
          }
          placeholder="We are a technology consultancy specialising in cloud migration and digital transformation for UK public sector organisations..."
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] outline-none transition-all bg-white resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Primary sectors
        </label>
        <p className="text-xs text-slate-400 mb-3">
          Select all sectors you actively bid in
        </p>
        <div className="flex flex-wrap gap-2">
          {SECTORS_OPTIONS.map((s) => (
            <ToggleChip
              key={s}
              label={s}
              selected={profile.sectors.includes(s)}
              onClick={() =>
                setProfile((p) => ({
                  ...p,
                  sectors: p.sectors.includes(s)
                    ? p.sectors.filter((x) => x !== s)
                    : [...p.sectors, s],
                }))
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2({
  profile,
  setProfile,
}: {
  profile: ProfileState;
  setProfile: React.Dispatch<React.SetStateAction<ProfileState>>;
}) {
  return (
    <div className="space-y-6">
      <TagInput
        label="Capabilities"
        hint="What can your team deliver? Press Enter or comma to add."
        items={profile.capabilities}
        suggestions={COMMON_CAPABILITIES}
        onChange={(v) => setProfile((p) => ({ ...p, capabilities: v }))}
        placeholder="e.g. Cloud Migration, DevOps, Cyber Security…"
      />

      <TagInput
        label="Certifications & accreditations"
        hint="Any held certifications that strengthen bids"
        items={profile.certifications}
        suggestions={COMMON_CERTS}
        onChange={(v) => setProfile((p) => ({ ...p, certifications: v }))}
        placeholder="e.g. ISO 27001, Cyber Essentials Plus…"
      />
    </div>
  );
}

function Step3({
  profile,
  setProfile,
}: {
  profile: ProfileState;
  setProfile: React.Dispatch<React.SetStateAction<ProfileState>>;
}) {
  function fmt(val: string) {
    const n = Number(val);
    if (!val || isNaN(n)) return "";
    return n >= 1_000_000
      ? `£${(n / 1_000_000).toFixed(1)}M`
      : `£${(n / 1_000).toFixed(0)}k`;
  }

  return (
    <div className="space-y-6">
      {/* Contract range */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Typical contract value range
        </label>
        <p className="text-xs text-slate-400 mb-3">
          Helps the AI filter out tenders that are too small or too large
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Minimum (£)</label>
            <input
              type="number"
              min="0"
              value={profile.typical_contract_min}
              onChange={(e) =>
                setProfile((p) => ({ ...p, typical_contract_min: e.target.value }))
              }
              placeholder="50000"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] outline-none transition-all bg-white"
            />
            {profile.typical_contract_min && (
              <p className="text-xs text-[#006b5f] mt-1 font-medium">
                {fmt(profile.typical_contract_min)}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Maximum (£)</label>
            <input
              type="number"
              min="0"
              value={profile.typical_contract_max}
              onChange={(e) =>
                setProfile((p) => ({ ...p, typical_contract_max: e.target.value }))
              }
              placeholder="2000000"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] outline-none transition-all bg-white"
            />
            {profile.typical_contract_max && (
              <p className="text-xs text-[#006b5f] mt-1 font-medium">
                {fmt(profile.typical_contract_max)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Preferred notice types */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Preferred notice types
        </label>
        <div className="flex flex-wrap gap-2">
          {NOTICE_TYPE_OPTIONS.map(({ value, label }) => (
            <ToggleChip
              key={value}
              label={label}
              selected={profile.preferred_notice_types.includes(value)}
              onClick={() =>
                setProfile((p) => ({
                  ...p,
                  preferred_notice_types: p.preferred_notice_types.includes(value)
                    ? p.preferred_notice_types.filter((x) => x !== value)
                    : [...p.preferred_notice_types, value],
                }))
              }
            />
          ))}
        </div>
      </div>

      {/* Excluded keywords */}
      <TagInput
        label="Excluded keywords"
        hint="Tenders containing these words will be down-ranked by the AI"
        items={profile.excluded_keywords}
        onChange={(v) => setProfile((p) => ({ ...p, excluded_keywords: v }))}
        placeholder="e.g. Nuclear, Overseas, Legal…"
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const STEP_META = [
  { title: "Company basics", description: "Tell AI who you are" },
  { title: "Capabilities", description: "Skills and accreditations" },
  { title: "Preferences", description: "Budget, notice types and exclusions" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<ProfileState>({
    company_name: "",
    description: "",
    capabilities: [],
    certifications: [],
    sectors: [],
    typical_contract_min: "",
    typical_contract_max: "",
    excluded_keywords: [],
    preferred_notice_types: ["tender"],
  });

  function canNext(): boolean {
    if (step === 1) return profile.company_name.trim().length > 0 && profile.description.trim().length > 0;
    return true;
  }

  async function handleFinish() {
    setError("");
    setLoading(true);
    try {
      await saveCompanyProfile({
        company_name: profile.company_name,
        description: profile.description,
        capabilities: profile.capabilities,
        certifications: profile.certifications,
        sectors: profile.sectors,
        typical_contract_min: profile.typical_contract_min
          ? Number(profile.typical_contract_min)
          : null,
        typical_contract_max: profile.typical_contract_max
          ? Number(profile.typical_contract_max)
          : null,
        excluded_keywords: profile.excluded_keywords,
        preferred_notice_types: profile.preferred_notice_types,
        onboarding_completed: true,
      });
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  function skipToApp() {
    if (!getAccessToken()) { router.replace("/login"); return; }
    router.replace("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col">
      {/* Top bar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-2">
          <MdOutlineAccountTree className="text-[#00236f] text-xl" />
          <span className="font-bold text-[#00236f]">TenderFlow AI</span>
        </div>
        <button
          onClick={skipToApp}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          Skip for now →
        </button>
      </div>

      {/* Step progress */}
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-0">
            {STEP_META.map((s, i) => {
              const n = i + 1;
              const done = step > n;
              const active = step === n;
              return (
                <div key={n} className="flex items-center flex-1">
                  <div className="flex items-center gap-3 shrink-0">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        done
                          ? "bg-[#71f8e4] text-[#00236f]"
                          : active
                          ? "bg-[#00236f] text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : n}
                    </div>
                    <div className="hidden sm:block">
                      <p
                        className={`text-xs font-bold ${
                          active ? "text-[#00236f]" : done ? "text-[#006b5f]" : "text-slate-400"
                        }`}
                      >
                        {s.title}
                      </p>
                      <p className="text-[10px] text-slate-400">{s.description}</p>
                    </div>
                  </div>
                  {n < TOTAL_STEPS && (
                    <div
                      className={`flex-1 h-0.5 mx-4 transition-colors ${
                        done ? "bg-[#71f8e4]" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center p-8 pt-10">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <p className="text-xs font-bold text-[#006b5f] uppercase tracking-widest mb-2">
              Step {step} of {TOTAL_STEPS}
            </p>
            <h1 className="text-3xl font-black text-[#00236f]">
              {STEP_META[step - 1].title}
            </h1>
            <p className="text-slate-500 mt-1">
              {step === 1 && "This helps the AI understand who you are and what tenders are relevant."}
              {step === 2 && "The AI uses these to check whether you can meet tender requirements."}
              {step === 3 && "Fine-tune how the AI filters and scores tenders for your team."}
            </p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            {step === 1 && <Step1 profile={profile} setProfile={setProfile} />}
            {step === 2 && <Step2 profile={profile} setProfile={setProfile} />}
            {step === 3 && <Step3 profile={profile} setProfile={setProfile} />}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-[#00236f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                disabled={!canNext()}
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading || !canNext()}
                onClick={handleFinish}
                className="flex items-center gap-2 px-8 py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Finish setup
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

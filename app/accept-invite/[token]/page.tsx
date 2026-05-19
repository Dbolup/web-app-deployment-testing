"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { getInvitePreview, acceptInvite, getAccessToken, InvitePreview } from "@/lib/api";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  reviewer: "Reviewer",
  member: "Member",
};

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getInvitePreview(token)
      .then(setPreview)
      .catch((e) => setLoadError(e.message ?? "Invalid or expired invitation"));
  }, [token]);

  async function handleAccept() {
    if (!getAccessToken()) {
      router.push(`/login?next=/accept-invite/${token}`);
      return;
    }
    setAccepting(true);
    setAcceptError(null);
    try {
      await acceptInvite(token);
      setAccepted(true);
    } catch (e: any) {
      setAcceptError(e.message ?? "Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-[#00236f] px-8 py-7">
          <p className="text-xs font-bold text-[#93c5fd] tracking-widest uppercase mb-2">TenderFlow AI</p>
          <h1 className="text-2xl font-bold text-white">Team Invitation</h1>
        </div>

        <div className="px-8 py-8">

          {/* Loading */}
          {!preview && !loadError && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-[#00236f]" />
              <p className="text-sm text-slate-500">Loading invitation…</p>
            </div>
          )}

          {/* Invalid / expired */}
          {loadError && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <XCircle className="h-10 w-10 text-[#ef4444]" />
              <p className="font-semibold text-slate-800">{loadError}</p>
              <p className="text-sm text-slate-500">This invitation link may have already been used or has expired.</p>
            </div>
          )}

          {/* Accepted */}
          {accepted && preview && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-[#16a34a]" />
              <p className="font-bold text-slate-800 text-lg">You've joined {preview.workspace_name}!</p>
              <p className="text-sm text-slate-500">Your role is <strong>{ROLE_LABELS[preview.role] ?? preview.role}</strong>.</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="mt-4 px-6 py-2.5 bg-[#00236f] text-white rounded-xl font-bold text-sm hover:bg-[#1e3a8a] transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Preview + accept */}
          {preview && !accepted && (
            <>
              <p className="text-slate-600 text-sm mb-6">
                You've been invited to join a workspace on TenderFlow.
              </p>

              {/* Details card */}
              <div className="bg-[#f0f4ff] rounded-xl border border-[#dce2f3] p-5 mb-6 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Workspace</p>
                  <p className="font-bold text-[#00236f] text-base">{preview.workspace_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Your Role</p>
                  <p className="font-bold text-slate-700 text-base">{ROLE_LABELS[preview.role] ?? preview.role}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Invited Email</p>
                  <p className="text-slate-600 text-sm">{preview.email}</p>
                </div>
              </div>

              {acceptError && (
                <p className="text-sm text-[#ef4444] mb-4">{acceptError}</p>
              )}

              {!getAccessToken() && (
                <p className="text-xs text-slate-400 mb-3 text-center">
                  You'll be asked to log in before joining.
                </p>
              )}

              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full py-3.5 bg-[#00236f] text-white rounded-xl font-bold text-sm hover:bg-[#1e3a8a] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {accepting && <Loader2 className="h-4 w-4 animate-spin" />}
                {accepting ? "Joining…" : "Accept Invitation"}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

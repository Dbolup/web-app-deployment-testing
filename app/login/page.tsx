"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MdOutlineAccountTree } from "react-icons/md";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { login, setTokens, getAccessToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getAccessToken()) router.replace("/dashboard");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tokens = await login(email, password);
      setTokens(tokens.access, tokens.refresh);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[480px] shrink-0 bg-[#00236f] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute border border-white rounded-full"
              style={{
                width: `${(i + 1) * 180}px`,
                height: `${(i + 1) * 180}px`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 text-white">
            <MdOutlineAccountTree className="text-2xl text-[#71f8e4]" />
            <span className="text-xl font-bold">TenderFlow AI</span>
          </div>
          <p className="text-[#71f8e4] text-xs uppercase tracking-widest mt-1">
            Procurement Intelligence
          </p>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-black text-white leading-tight">
              Win more government contracts.
            </h2>
            <p className="mt-4 text-[#b6c4ff] text-lg leading-relaxed">
              AI-powered tender discovery, qualification, and pipeline management
              — built for procurement teams.
            </p>
          </div>

          <div className="space-y-4">
            {[
              "Automatic tender discovery from Find a Tender",
              "AI scoring against your company profile",
              "Human-in-the-loop review workflow",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-[#71f8e4] flex items-center justify-center shrink-0">
                  <svg className="h-3 w-3 text-[#00236f]" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[#dce1ff] text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[#6b7db3] text-xs">
          © {new Date().getFullYear()} TenderFlow AI. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <MdOutlineAccountTree className="text-[#00236f] text-2xl" />
            <span className="font-bold text-[#00236f] text-xl">TenderFlow AI</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-[#00236f]">Welcome back</h1>
            <p className="text-slate-500 mt-2">Sign in to your workspace</p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] outline-none transition-all bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] outline-none transition-all bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#00236f] font-bold hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

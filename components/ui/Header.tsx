"use client";

import { Bell, LucideSearch, MessageSquare } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <header className="flex justify-between items-center px-6 h-16 w-full bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center flex-1 max-w-xl">
        {/* <div className="flex items-center justify-between h-10 max-w-7xl mx-auto"> */}
        {/* Search */}
        <div className="w-full relative">
          {!isFocused && (
            <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          )}

          {/* Input */}
          <input
            type="text"
            placeholder="Search tenders, agencies, or documents..."
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className=" w-full pl-10 pr-4 py-2 bg-[#f0f3ff] border border-[#c5c5d3] rounded-full text-sm focus:ring-2 focus:ring-[#00236f]/10 focus:border-[#00236f] outline-none transition-all"
          />
        </div>
      </div>
      {/* Right side */}
      <div className="flex items-center gap-4">
        <Bell className="w-5 h-5 text-gray-600 cursor-pointer hover:text-blue-900 transition-colors" />
        <MessageSquare className="w-5 h-5  text-gray-600 cursor-pointer hover:text-blue-900 transition-colors" />
        <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-200">
          <img
            src="https://i.pravatar.cc/40"
            alt="user"
            className="w-9 h-9 rounded-xl object-cover"
          />
        </div>
      </div>
    </header>
  );
}

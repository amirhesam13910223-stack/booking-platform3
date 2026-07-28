import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { APP_NAME } from "@/lib/constants";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-30 h-14 bg-surface-950/80 backdrop-blur-xl border-b border-surface-800 flex items-center justify-between px-4">
      {/* Right side: menu button + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
          aria-label="منو"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-semibold text-surface-200 lg:hidden">
          {APP_NAME}
        </h1>
      </div>

      {/* Left side: notifications bell */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
          aria-label="اعلان‌ها"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -left-0.5 w-4.5 h-4.5 min-w-[18px] px-1 flex items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "۹+" : unreadCount.toLocaleString("fa-IR")}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

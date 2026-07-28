import { NavLink, useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { APP_NAME } from "@/lib/constants";
import {
  MessageSquare,
  FileText,
  PenTool,
  Code2,
  CreditCard,
  Gift,
  Bell,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "داشبورد", icon: Sparkles },
  { to: "/chat", label: "گفتگو", icon: MessageSquare },
  { to: "/documents", label: "اسناد", icon: FileText },
  { to: "/content", label: "تولید محتوا", icon: PenTool },
  { to: "/code", label: "دستیار کد", icon: Code2 },
  { to: "/billing", label: "اشتراک", icon: CreditCard },
  { to: "/referral", label: "دعوت دوستان", icon: Gift },
  { to: "/notifications", label: "اعلان‌ها", icon: Bell },
  { to: "/settings", label: "تنظیمات", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          "fixed top-0 right-0 z-50 h-full w-64 bg-surface-900 border-l border-surface-800",
          "flex flex-col transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-surface-800">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-surface-100">{APP_NAME}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-brand-600/10 text-brand-400 border border-brand-600/20"
                    : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
                )
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-surface-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-surface-700 flex items-center justify-center text-sm font-bold text-surface-300">
              {profile?.full_name?.charAt(0) || "ک"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-200 truncate">
                {profile?.full_name || "کاربر"}
              </p>
              <p className="text-xs text-surface-500 truncate">
                {profile?.phone_number || ""}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            خروج از حساب
          </button>
        </div>
      </aside>
    </>
  );
}

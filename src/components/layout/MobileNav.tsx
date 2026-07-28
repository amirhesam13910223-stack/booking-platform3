import { NavLink } from "react-router-dom";
import { clsx } from "clsx";
import { MessageSquare, FileText, PenTool, Code2, LayoutDashboard } from "lucide-react";

const items = [
  { to: "/dashboard", label: "خانه", icon: LayoutDashboard },
  { to: "/chat", label: "گفتگو", icon: MessageSquare },
  { to: "/documents", label: "اسناد", icon: FileText },
  { to: "/content", label: "محتوا", icon: PenTool },
  { to: "/code", label: "کد", icon: Code2 },
];

/**
 * MobileNav - نوار ناوبری پایین صفحه برای موبایل
 */
export function MobileNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-surface-900/95 backdrop-blur-xl border-t border-surface-800 lg:hidden">
      <div className="flex items-center justify-around py-2 px-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                isActive ? "text-brand-400" : "text-surface-500 hover:text-surface-300"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

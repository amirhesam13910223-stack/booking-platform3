import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { APP_NAME, PLANS } from "@/lib/constants";
import {
  MessageSquare,
  FileText,
  PenTool,
  Code2,
  Gift,
  TrendingUp,
  Zap,
  ArrowLeft,
} from "lucide-react";

interface UsageStats {
  todayMessages: number;
  monthDocuments: number;
  monthContent: number;
  creditBalance: number;
}

const modules = [
  {
    to: "/chat",
    title: "گفتگوی هوشمند",
    description: "سوال بپرسید، ایده بگیرید، ترجمه کنید",
    icon: MessageSquare,
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
  {
    to: "/documents",
    title: "تحلیل اسناد",
    description: "آپلود PDF، خلاصه‌سازی و استخراج اطلاعات",
    icon: FileText,
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
  {
    to: "/content",
    title: "تولید محتوا",
    description: "مقاله، کپشن، ایمیل و متن تبلیغاتی",
    icon: PenTool,
    color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },
  {
    to: "/code",
    title: "دستیار کد",
    description: "دیباگ، توضیح کد و تولید اسکریپت",
    icon: Code2,
    color: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  },
];

/**
 * Dashboard - صفحه اصلی بعد از ورود
 * شامل: خوش‌آمدگویی، دسترسی سریع به ماژول‌ها، بنر رفرال، آمار مصرف
 */
export default function Dashboard() {
  const { profile } = useAuth();
  const { subscription, plan } = useSubscription();
  const [stats, setStats] = useState<UsageStats>({
    todayMessages: 0,
    monthDocuments: 0,
    monthContent: 0,
    creditBalance: 0,
  });

  useEffect(() => {
    if (!profile) return;
    fetchStats();
  }, [profile]);

  const fetchStats = async () => {
    if (!profile) return;

    try {
      // اعتبار
      const { data: credits } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", profile.id)
        .single();

      // پیام‌های امروز
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count: msgCount } = await supabase
        .from("usage_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("action_type", "message")
        .gte("created_at", todayStart.toISOString());

      // اسناد این ماه
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count: docCount } = await supabase
        .from("usage_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("action_type", "document")
        .gte("created_at", monthStart.toISOString());

      const { count: contentCount } = await supabase
        .from("usage_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("action_type", "content")
        .gte("created_at", monthStart.toISOString());

      setStats({
        todayMessages: msgCount ?? 0,
        monthDocuments: docCount ?? 0,
        monthContent: contentCount ?? 0,
        creditBalance: credits?.balance ?? 0,
      });
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  const dailyLimit = plan?.daily_message_limit ?? PLANS.FREE.dailyMessageLimit;
  const usagePercent = Math.min(100, Math.round((stats.todayMessages / dailyLimit) * 100));

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-l from-brand-600/20 to-surface-900 rounded-2xl border border-brand-600/20 p-6">
        <h1 className="text-xl lg:text-2xl font-bold text-surface-100 mb-1">
          سلام{profile?.full_name ? `، ${profile.full_name}` : ""}! 👋
        </h1>
        <p className="text-sm text-surface-400">
          امروز چطور می‌تونم کمکتون کنم؟
        </p>

        {/* Quick Usage Bar */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-surface-400 mb-1">
              <span>پیام‌های امروز</span>
              <span>
                {stats.todayMessages.toLocaleString("fa-IR")} / {dailyLimit.toLocaleString("fa-IR")}
              </span>
            </div>
            <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-brand-400">
            <Zap className="w-4 h-4" />
            <span className="font-bold">{stats.creditBalance.toLocaleString("fa-IR")}</span>
            <span className="text-xs text-surface-500">اعتبار</span>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-lg font-bold text-surface-200 mb-4">ماژول‌ها</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((mod) => (
            <Link
              key={mod.to}
              to={mod.to}
              className="group flex items-start gap-4 bg-surface-900 rounded-2xl border border-surface-800 p-5 hover:border-surface-700 hover:bg-surface-800/50 transition-all duration-200"
            >
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${mod.color}`}>
                <mod.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-surface-200 group-hover:text-surface-100 mb-1">
                  {mod.title}
                </h3>
                <p className="text-xs text-surface-500 leading-relaxed">
                  {mod.description}
                </p>
              </div>
              <ArrowLeft className="w-4 h-4 text-surface-600 group-hover:text-surface-400 transition-colors mt-1" />
            </Link>
          ))}
        </div>
      </div>

      {/* Referral Banner */}
      <Link
        to="/referral"
        className="flex items-center gap-4 bg-gradient-to-l from-amber-500/10 to-surface-900 rounded-2xl border border-amber-500/20 p-5 hover:border-amber-500/30 transition-all duration-200"
      >
        <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-surface-200 mb-0.5">
            ۵۰ پیام رایگان بگیرید — دوستانتان را دعوت کنید!
          </h3>
          <p className="text-xs text-surface-500">
            با هر دعوت موفق، ۵۰ اعتبار رایگان + شانس برنده شدن در جدول ماهانه
          </p>
        </div>
        <TrendingUp className="w-5 h-5 text-amber-400 shrink-0" />
      </Link>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-900 rounded-xl border border-surface-800 p-4 text-center">
          <p className="text-2xl font-bold text-surface-100">
            {stats.todayMessages.toLocaleString("fa-IR")}
          </p>
          <p className="text-xs text-surface-500 mt-1">پیام امروز</p>
        </div>
        <div className="bg-surface-900 rounded-xl border border-surface-800 p-4 text-center">
          <p className="text-2xl font-bold text-surface-100">
            {stats.monthDocuments.toLocaleString("fa-IR")}
          </p>
          <p className="text-xs text-surface-500 mt-1">سند این ماه</p>
        </div>
        <div className="bg-surface-900 rounded-xl border border-surface-800 p-4 text-center">
          <p className="text-2xl font-bold text-surface-100">
            {stats.monthContent.toLocaleString("fa-IR")}
          </p>
          <p className="text-xs text-surface-500 mt-1">محتوای این ماه</p>
        </div>
      </div>
    </div>
  );
}

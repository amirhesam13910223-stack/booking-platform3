import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Spinner } from "@/components/ui/Spinner";
import { APP_NAME } from "@/lib/constants";
import toast from "react-hot-toast";

/**
 * GoogleCallback - مدیریت callback ورود با گوگل OAuth
 * - بررسی session
 * - ساخت profile برای کاربر جدید
 * - redirect به onboarding یا dashboard
 */
export default function GoogleCallback() {
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const handleAuth = async () => {
      try {
        // صبر برای پردازش URL hash توسط Supabase
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          toast.error("خطا در ورود با گوگل. دوباره تلاش کنید.");
          navigate("/login", { replace: true });
          return;
        }

        const userId = session.user.id;

        // بررسی وجود profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, onboarding_completed")
          .eq("id", userId)
          .single();

        if (!profile) {
          // ساخت profile جدید
          const referralCode = generateReferralCode();
          const fullName =
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            null;
          const avatarUrl = session.user.user_metadata?.avatar_url || null;

          // بررسی referral code از URL
          const urlParams = new URLSearchParams(window.location.search);
          const refCode = urlParams.get("ref") || localStorage.getItem("pending_ref");

          const { error: insertError } = await supabase.from("profiles").insert({
            id: userId,
            full_name: fullName,
            avatar_url: avatarUrl,
            referral_code: referralCode,
            referred_by: refCode,
            signup_ip: null, // از سمت سرور پر می‌شود
            onboarding_completed: false,
          });

          if (insertError) {
            console.error("Error creating profile:", insertError);
            toast.error("خطا در ساخت پروفایل");
          }

          // پاک کردن ref موقت
          localStorage.removeItem("pending_ref");

          // اگر referral code داشت، trigger process-referral
          if (refCode) {
            await supabase.functions.invoke("process-referral", {
              body: { referral_code: refCode, new_user_id: userId },
            });
          }

          // کاربر جدید → onboarding
          toast.success(`به ${APP_NAME} خوش آمدید! 🎉`);
          navigate("/onboarding", { replace: true });
        } else if (!profile.onboarding_completed) {
          navigate("/onboarding", { replace: true });
        } else {
          toast.success("خوش برگشتید! 👋");
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        console.error("Google callback error:", err);
        toast.error("خطای ناشناخته. دوباره تلاش کنید.");
        navigate("/login", { replace: true });
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-950">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-surface-400 text-sm">در حال ورود با گوگل...</p>
      </div>
    </div>
  );
}

/** ساخت کد رفرال ۶ کاراکتری یکتا */
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

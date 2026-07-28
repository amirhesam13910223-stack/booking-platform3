import { useState, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { APP_NAME, OTP } from "@/lib/constants";
import { Smartphone, Sparkles, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

/**
 * PhoneLogin - صفحه ورود با شماره موبایل + OTP
 * شامل: اعتبارسنجی شماره ایرانی، CAPTCHA ساده، دکمه گوگل
 */
export default function PhoneLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref"); // کد رفرال از لینک دعوت

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // CAPTCHA ساده ریاضی
  const [captchaA] = useState(() => Math.floor(Math.random() * 9) + 1);
  const [captchaB] = useState(() => Math.floor(Math.random() * 9) + 1);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  // اعتبارسنجی شماره موبایل ایرانی
  const validatePhone = (value: string): boolean => {
    const cleaned = value.replace(/\s/g, "");
    // فرمت: 09xxxxxxxxx (۱۱ رقم)
    const regex = /^09[0-9]{9}$/;
    if (!regex.test(cleaned)) {
      setError("شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد");
      return false;
    }
    setError("");
    return true;
  };

  // ارسال OTP
  const handleSendOtp = useCallback(async () => {
    // اعتبارسنجی شماره
    if (!validatePhone(phone)) return;

    // بررسی CAPTCHA
    if (parseInt(captchaAnswer) !== captchaA + captchaB) {
      setCaptchaError("پاسخ صحیح نیست، دوباره تلاش کنید");
      return;
    }
    setCaptchaError("");

    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("send-otp", {
        body: { phone_number: phone.replace(/\s/g, "") },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data && !data.success) {
        // خطاهای خاص
        if (data.error_code === "RATE_LIMITED") {
          toast.error("تعداد درخواست‌ها بیش از حد مجاز است. لطفاً ۱۰ دقیقه صبر کنید.");
        } else if (data.error_code === "LOCKED") {
          toast.error("این شماره موقتاً قفل شده است. لطفاً ۵ دقیقه صبر کنید.");
        } else {
          toast.error(data.message || "خطایی رخ داد. دوباره تلاش کنید.");
        }
        return;
      }

      // موفق - هدایت به صفحه تأیید کد
      toast.success("کد تأیید ارسال شد");
      navigate("/verify-otp", {
        state: { phone: phone.replace(/\s/g, ""), ref: refCode },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطای ناشناخته";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [phone, captchaAnswer, captchaA, captchaB, navigate, refCode]);

  // ورود با گوگل
  const handleGoogleLogin = async () => {
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) {
        toast.error("خطا در ورود با گوگل. دوباره تلاش کنید.");
      }
    } catch {
      toast.error("خطای ناشناخته در ورود با گوگل");
    }
  };

  // فرمت‌دهی شماره هنگام تایپ
  const handlePhoneChange = (value: string) => {
    // فقط اعداد مجاز هستند
    const cleaned = value.replace(/[^0-9]/g, "").slice(0, 11);
    setPhone(cleaned);
    if (error) setError("");
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-100 mb-2">
            ورود به {APP_NAME}
          </h1>
          <p className="text-sm text-surface-400">
            با شماره موبایل یا حساب گوگل وارد شوید
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface-900 rounded-2xl border border-surface-800 p-6 space-y-5">
          {/* Phone Input */}
          <Input
            label="شماره موبایل"
            type="tel"
            dir="ltr"
            placeholder="09123456789"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
            error={error}
            icon={<Smartphone className="w-4 h-4" />}
            fullWidth
            hint="شماره باید با ۰۹ شروع شود"
          />

          {/* Simple Math CAPTCHA */}
          <div className="bg-surface-800/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-surface-400 text-xs">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>برای جلوگیری از ربات، حاصل جمع را وارد کنید:</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-surface-200 select-none" dir="ltr">
                {captchaA.toLocaleString("fa-IR")} + {captchaB.toLocaleString("fa-IR")} =
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={captchaAnswer}
                onChange={(e) => {
                  setCaptchaAnswer(e.target.value.replace(/[^0-9]/g, ""));
                  if (captchaError) setCaptchaError("");
                }}
                className="w-14 h-10 text-center rounded-lg border border-surface-600 bg-surface-900 text-surface-100 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                dir="ltr"
              />
            </div>
            {captchaError && (
              <p className="text-xs text-red-400">{captchaError}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSendOtp}
            loading={loading}
            fullWidth
            size="lg"
            disabled={phone.length !== 11 || captchaAnswer.length === 0}
          >
            ارسال کد تأیید
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-700" />
            <span className="text-xs text-surface-500">یا</span>
            <div className="flex-1 h-px bg-surface-700" />
          </div>

          {/* Google Login */}
          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            fullWidth
            size="lg"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            }
          >
            ورود با گوگل
          </Button>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-surface-500">
            با ورود، {" "}
            <Link to="/terms" className="text-brand-400 hover:text-brand-300 underline">
              قوانین استفاده
            </Link>
            {" "} و {" "}
            <Link to="/privacy" className="text-brand-400 hover:text-brand-300 underline">
              حریم خصوصی
            </Link>
            {" "} را می‌پذیرید.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { APP_NAME, OTP } from "@/lib/constants";
import { ShieldCheck, ArrowRight, RefreshCw, Lock } from "lucide-react";
import toast from "react-hot-toast";

/**
 * OtpVerify - صفحه تأیید کد OTP
 * شامل: ۵ خانه کد، تایمر ۲ دقیقه‌ای، resend، قفل بعد از ۳ تلاش
 */
export default function OtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { phone?: string; ref?: string } | null;

  const phone = state?.phone || "";
  const refCode = state?.ref || null;

  // اگر بدون state وارد شد، برگرد به صفحه ورود
  useEffect(() => {
    if (!phone) {
      navigate("/login", { replace: true });
    }
  }, [phone, navigate]);

  const [digits, setDigits] = useState<string[]>(Array(OTP.CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);

  // تایمر شمارش معکوس برای resend
  const [resendTimer, setResendTimer] = useState(OTP.RESEND_COOLDOWN_SECONDS);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // فوکوس روی اولین خانه
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // تایمر resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // تایمر قفل
  useEffect(() => {
    if (lockSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setLocked(false);
          setAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockSeconds]);

  // تبدیل ثانیه به فرمت فارسی
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toLocaleString("fa-IR")}:${s.toLocaleString("fa-IR").padStart(2, "۰")}`;
  };

  // مدیریت تایپ در خانه‌های کد
  const handleDigitChange = (index: number, value: string) => {
    if (locked) return;

    const char = value.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError("");

    // رفتن به خانه بعدی
    if (char && index < OTP.CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // ارسال خودکار وقتی همه خانه‌ها پر شد
    if (char && index === OTP.CODE_LENGTH - 1 && newDigits.every((d) => d !== "")) {
      handleVerify(newDigits.join(""));
    }
  };

  // مدیریت Backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
    }
  };

  // مدیریت Paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, OTP.CODE_LENGTH);
    if (pasted.length === OTP.CODE_LENGTH) {
      const newDigits = pasted.split("");
      setDigits(newDigits);
      inputRefs.current[OTP.CODE_LENGTH - 1]?.focus();
      handleVerify(pasted);
    }
  };

  // تأیید کد OTP
  const handleVerify = useCallback(async (code?: string) => {
    const otpCode = code || digits.join("");

    if (otpCode.length !== OTP.CODE_LENGTH) {
      setError("لطفاً کد ۵ رقمی را کامل وارد کنید");
      return;
    }

    if (locked) return;

    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("verify-otp", {
        body: {
          phone_number: phone,
          code: otpCode,
          referral_code: refCode,
        },
      });

      if (fnError) throw new Error(fnError.message);

      if (data && !data.success) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (data.error_code === "LOCKED") {
          setLocked(true);
          setLockSeconds(OTP.LOCKOUT_MINUTES * 60);
          toast.error(`شماره به مدت ${OTP.LOCKOUT_MINUTES.toLocaleString("fa-IR")} دقیقه قفل شد`);
        } else if (data.error_code === "EXPIRED") {
          toast.error("کد تأیید منقضی شده است. کد جدید درخواست دهید.");
        } else if (data.error_code === "INVALID_CODE") {
          const remaining = OTP.MAX_ATTEMPTS - newAttempts;
          if (remaining > 0) {
            setError(`کد اشتباه است. ${remaining.toLocaleString("fa-IR")} تلاش باقی‌مانده`);
          }
          // پاک کردن خانه‌ها
          setDigits(Array(OTP.CODE_LENGTH).fill(""));
          inputRefs.current[0]?.focus();
        } else {
          toast.error(data.message || "خطایی رخ داد");
        }
        return;
      }

      // موفق! - session در data.session ذخیره شده
      if (data?.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      toast.success("ورود موفقیت‌آمیز بود! 🎉");

      // بررسی کاربر جدید برای onboarding
      if (data?.is_new_user) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطای ناشناخته";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [digits, phone, refCode, attempts, locked, navigate]);

  // ارسال مجدد کد
  const handleResend = async () => {
    if (resendTimer > 0 || locked) return;

    setResendLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("send-otp", {
        body: { phone_number: phone },
      });

      if (fnError) throw new Error(fnError.message);

      if (data && !data.success) {
        toast.error(data.message || "خطا در ارسال مجدد کد");
        return;
      }

      toast.success("کد جدید ارسال شد");
      setResendTimer(OTP.RESEND_COOLDOWN_SECONDS);
      setDigits(Array(OTP.CODE_LENGTH).fill(""));
      setAttempts(0);
      setError("");
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطای ناشناخته";
      toast.error(message);
    } finally {
      setResendLoading(false);
    }
  };

  if (!phone) return null;

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-surface-100 mb-2">کد تأیید</h1>
          <p className="text-sm text-surface-400">
            کد ۵ رقمی ارسال‌شده به شماره
            <br />
            <span className="font-bold text-surface-200" dir="ltr">{phone}</span>
            {" "}را وارد کنید
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface-900 rounded-2xl border border-surface-800 p-6 space-y-6">
          {/* OTP Input Boxes */}
          <div className="flex items-center justify-center gap-2" dir="ltr" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={locked || loading}
                className={`
                  w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all duration-200
                  bg-surface-800 text-surface-100
                  focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${digit ? "border-brand-500/50" : "border-surface-600"}
                  ${error ? "border-red-500/50" : ""}
                `}
                aria-label={`رقم ${index + 1}`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}

          {/* Lock Message */}
          {locked && (
            <div className="flex items-center justify-center gap-2 text-sm text-amber-400 bg-amber-400/10 rounded-xl p-3">
              <Lock className="w-4 h-4" />
              <span>
                قفل شده — {formatTime(lockSeconds)} دیگر
              </span>
            </div>
          )}

          {/* Verify Button */}
          <Button
            onClick={() => handleVerify()}
            loading={loading}
            fullWidth
            size="lg"
            disabled={locked || digits.some((d) => d === "")}
          >
            تأیید کد
          </Button>

          {/* Resend Section */}
          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-xs text-surface-500">
                ارسال مجدد کد تا {formatTime(resendTimer)} دیگر
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendLoading || locked}
                className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? "animate-spin" : ""}`} />
                ارسال مجدد کد
              </button>
            )}
          </div>
        </div>

        {/* Back to login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-200 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به صفحه ورود
          </Link>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { APP_NAME, PLANS, REFERRAL } from "@/lib/constants";
import { MessageSquare, Zap, Gift, ChevronLeft, ChevronRight, Rocket } from "lucide-react";
import toast from "react-hot-toast";

interface Step {
  icon: typeof MessageSquare;
  title: string;
  description: string;
  highlights: string[];
}

const steps: Step[] = [
  {
    icon: MessageSquare,
    title: `به ${APP_NAME} خوش آمدید!`,
    description:
      "دستیار هوشمند فارسی‌زبان شما برای گفتگو، تحلیل اسناد، تولید محتوا و برنامه‌نویسی. همه‌چیز در یک پلتفرم.",
    highlights: [
      "گفتگوی هوشمند فارسی با هوش مصنوعی",
      "تحلیل و خلاصه‌سازی اسناد",
      "تولید محتوای حرفه‌ای",
      "دستیار برنامه‌نویسی",
    ],
  },
  {
    icon: Zap,
    title: "اعتبار و سهمیه",
    description:
      "هر پلن تعداد مشخصی استفاده روزانه و ماهانه دارد. با ارتقای پلن، محدودیت‌ها بیشتر می‌شود.",
    highlights: [
      `پلن رایگان: ${PLANS.FREE.dailyMessageLimit.toLocaleString("fa-IR")} پیام در روز`,
      `پلن حرفه‌ای: ${PLANS.PRO.dailyMessageLimit.toLocaleString("fa-IR")} پیام در روز`,
      "سهمیه هر شب ساعت ۱۲ بازنشانی می‌شود",
      "با دعوت دوستان، اعتبار رایگان بگیرید",
    ],
  },
  {
    icon: Gift,
    title: "دوستانتان را دعوت کنید",
    description:
      `با هر دعوت موفق، ${REFERRAL.REFERRER_CREDITS.toLocaleString("fa-IR")} اعتبار رایگان دریافت کنید. دوست شما هم ${REFERRAL.REFERRED_CREDITS.toLocaleString("fa-IR")} اعتبار هدیه می‌گیرد!`,
    highlights: [
      `${REFERRAL.REFERRER_CREDITS.toLocaleString("fa-IR")} اعتبار برای شما به ازای هر دعوت`,
      `${REFERRAL.REFERRED_CREDITS.toLocaleString("fa-IR")} اعتبار هدیه برای دوست شما`,
      `${REFERRAL.FREE_PRO_THRESHOLD.toLocaleString("fa-IR")} دعوت موفق = یک هفته پلن حرفه‌ای رایگان`,
      "جدول برترین‌های ماهانه با جوایز ویژه",
    ],
  },
];

/**
 * Onboarding - تور خوش‌آمدگویی ۳ مرحله‌ای برای کاربران جدید
 */
export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = async () => {
    if (!user) return;

    setFinishing(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      if (error) {
        console.error("Onboarding update error:", error);
        toast.error("خطایی رخ داد. دوباره تلاش کنید.");
        return;
      }

      await refreshProfile();
      toast.success("آماده‌اید! بزن بریم 🚀");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Onboarding finish error:", err);
      toast.error("خطای ناشناخته");
    } finally {
      setFinishing(false);
    }
  };

  // رد کردن onboarding
  const handleSkip = async () => {
    if (!user) return;
    try {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);
      await refreshProfile();
      navigate("/dashboard", { replace: true });
    } catch {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "w-8 bg-brand-500"
                  : index < currentStep
                  ? "w-2 bg-brand-500/50"
                  : "w-2 bg-surface-700"
              }`}
              aria-label={`مرحله ${index + 1}`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-surface-900 rounded-2xl border border-surface-800 p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center">
            <step.icon className="w-8 h-8 text-brand-400" />
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-surface-100 mb-3">
            {step.title}
          </h1>

          {/* Description */}
          <p className="text-sm text-surface-400 leading-relaxed mb-6">
            {step.description}
          </p>

          {/* Highlights */}
          <div className="space-y-3 text-right">
            {step.highlights.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 bg-surface-800/50 rounded-xl p-3"
              >
                <span className="w-5 h-5 rounded-full bg-brand-600/20 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-sm text-surface-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3 mt-6">
          {!isLastStep && (
            <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 0}>
              <ChevronRight className="w-4 h-4" />
              قبلی
            </Button>
          )}

          <Button onClick={handleNext} loading={finishing} fullWidth size="lg">
            {isLastStep ? (
              <>
                <Rocket className="w-5 h-5" />
                شروع کنید
              </>
            ) : (
              <>
                بعدی
                <ChevronLeft className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {/* Skip */}
        <div className="text-center mt-4">
          <button
            onClick={handleSkip}
            className="text-xs text-surface-500 hover:text-surface-300 transition-colors"
          >
            رد کردن و رفتن به داشبورد
          </button>
        </div>
      </div>
    </div>
  );
}

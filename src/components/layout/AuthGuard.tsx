import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * AuthGuard - محافظت از route‌هایی که نیاز به احراز هویت دارند.
 * اگر کاربر لاگین نکرده باشد، به صفحه ورود هدایت می‌شود.
 * اگر کاربر جدید باشد (onboarding_completed = false)، به Onboarding هدایت می‌شود.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // در حال بارگذاری session
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-surface-400 text-sm">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // کاربر لاگین نکرده
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // کاربر جدید است و onboarding را کامل نکرده
  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

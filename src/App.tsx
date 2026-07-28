import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { lazy, Suspense, useState } from "react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Spinner } from "@/components/ui/Spinner";

// --- Public Pages ---
const Landing = lazy(() => import("@/pages/Landing"));
const PhoneLogin = lazy(() => import("@/pages/Auth/PhoneLogin"));
const OtpVerify = lazy(() => import("@/pages/Auth/OtpVerify"));
const GoogleCallback = lazy(() => import("@/pages/Auth/GoogleCallback"));
const Terms = lazy(() => import("@/pages/Legal/Terms"));
const Privacy = lazy(() => import("@/pages/Legal/Privacy"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// --- Auth Required Pages ---
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Chat = lazy(() => import("@/pages/Chat"));
const Documents = lazy(() => import("@/pages/Documents"));
const ContentGenerator = lazy(() => import("@/pages/ContentGenerator"));
const CodeAssistant = lazy(() => import("@/pages/CodeAssistant"));
const Billing = lazy(() => import("@/pages/Billing"));
const Referral = lazy(() => import("@/pages/Referral"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Settings = lazy(() => import("@/pages/Settings"));
const Support = lazy(() => import("@/pages/Support"));
const Changelog = lazy(() => import("@/pages/Changelog"));

// --- Admin Pages ---
const AdminDashboard = lazy(() => import("@/pages/Admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/pages/Admin/AdminUsers"));
const AdminPlans = lazy(() => import("@/pages/Admin/AdminPlans"));
const AdminFraud = lazy(() => import("@/pages/Admin/AdminFraud"));

/** لودر suspense */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );
}

/** Layout اصلی اپلیکیشن (Sidebar + Topbar + Content) */
function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#f1f5f9",
            border: "1px solid #334155",
            borderRadius: "12px",
            fontSize: "14px",
            fontFamily: "Vazirmatn, sans-serif",
          },
          duration: 4000,
        }}
      />
      <Routes>
        {/* ===== Public Routes ===== */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PhoneLogin />} />
        <Route path="/verify-otp" element={<OtpVerify />} />
        <Route path="/auth/callback" element={<GoogleCallback />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* ===== Onboarding (auth required, but no sidebar) ===== */}
        <Route
          path="/onboarding"
          element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <Onboarding />
              </Suspense>
            </AuthGuard>
          }
        />

        {/* ===== Protected Routes (with App Layout) ===== */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <AppLayout><Dashboard /></AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/chat"
          element={
            <AuthGuard>
              <AppLayout><Chat /></AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/documents"
          element={
            <AuthGuard>
              <AppLayout><Documents /></AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/content"
          element={
            <AuthGuard>
              <AppLayout><ContentGenerator /></AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/code"
          element={
            <AuthGuard>
              <AppLayout><CodeAssistant /></AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/billing"
          element={
            <AuthGuard>
              <AppLayout><Billing /></AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/referral"
          element={
            <AuthGuard>
              <AppLayout><Referral /></AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/notifications"
          element={
            <AuthGuard>
              <AppLayout><Notifications /></AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <AppLayout><Settings /></AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/support"
          element={
            <AuthGuard>
              <AppLayout><Support /></AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/changelog"
          element={
            <AuthGuard>
              <AppLayout><Changelog /></AppLayout>
            </AuthGuard>
          }
        />

        {/* ===== Admin Routes ===== */}
        <Route
          path="/admin"
          element={
            <AuthGuard>
              <AppLayout><AdminDashboard /></AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AuthGuard>
              <AppLayout><AdminUsers /></AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/admin/plans"
          element={
            <AuthGuard>
              <AppLayout><AdminPlans /></AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/admin/fraud"
          element={
            <AuthGuard>
              <AppLayout><AdminFraud /></AppLayout>
            </AuthGuard>
          }
        />

        {/* ===== Catch-all ===== */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { lazy, Suspense } from "react";

const Landing          = lazy(() => import("@/pages/Landing"));
const PhoneLogin       = lazy(() => import("@/pages/Auth/PhoneLogin"));
const OtpVerify        = lazy(() => import("@/pages/Auth/OtpVerify"));
const GoogleCallback   = lazy(() => import("@/pages/Auth/GoogleCallback"));
const Onboarding       = lazy(() => import("@/pages/Onboarding"));
const Dashboard        = lazy(() => import("@/pages/Dashboard"));
const Chat             = lazy(() => import("@/pages/Chat"));
const Documents        = lazy(() => import("@/pages/Documents"));
const ContentGenerator = lazy(() => import("@/pages/ContentGenerator"));
const CodeAssistant    = lazy(() => import("@/pages/CodeAssistant"));
const Billing          = lazy(() => import("@/pages/Billing"));
const Referral         = lazy(() => import("@/pages/Referral"));
const Notifications    = lazy(() => import("@/pages/Notifications"));
const Settings         = lazy(() => import("@/pages/Settings"));
const Support          = lazy(() => import("@/pages/Support"));
const Changelog        = lazy(() => import("@/pages/Changelog"));
const Terms            = lazy(() => import("@/pages/Legal/Terms"));
const Privacy          = lazy(() => import("@/pages/Legal/Privacy"));
const NotFound         = lazy(() => import("@/pages/NotFound"));
const AdminDashboard   = lazy(() => import("@/pages/Admin/AdminDashboard"));
const AdminUsers       = lazy(() => import("@/pages/Admin/AdminUsers"));
const AdminPlans       = lazy(() => import("@/pages/Admin/AdminPlans"));
const AdminFraud       = lazy(() => import("@/pages/Admin/AdminFraud"));

function Loader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-950">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/"              element={<Landing />} />
          <Route path="/login"         element={<PhoneLogin />} />
          <Route path="/verify"        element={<OtpVerify />} />
          <Route path="/auth/callback" element={<GoogleCallback />} />
          <Route path="/onboarding"    element={<Onboarding />} />
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/chat"          element={<Chat />} />
          <Route path="/documents"     element={<Documents />} />
          <Route path="/content"       element={<ContentGenerator />} />
          <Route path="/code"          element={<CodeAssistant />} />
          <Route path="/billing"       element={<Billing />} />
          <Route path="/referral"      element={<Referral />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings"      element={<Settings />} />
          <Route path="/support"       element={<Support />} />
          <Route path="/changelog"     element={<Changelog />} />
          <Route path="/terms"         element={<Terms />} />
          <Route path="/privacy"       element={<Privacy />} />
          <Route path="/admin"         element={<AdminDashboard />} />
          <Route path="/admin/users"   element={<AdminUsers />} />
          <Route path="/admin/plans"   element={<AdminPlans />} />
          <Route path="/admin/fraud"   element={<AdminFraud />} />
          <Route path="*"              element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "Vazirmatn, sans-serif",
            direction: "rtl",
            background: "#1e293b",
            color: "#f1f5f9",
            borderRadius: "12px",
          },
        }}
      />
    </BrowserRouter>
  );
}

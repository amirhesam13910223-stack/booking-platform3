import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-950">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 mx-auto border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-surface-400 text-sm">در حال ورود...</p>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      if (sub) {
        const { data: planData } = await supabase
          .from("plans")
          .select("*")
          .eq("id", sub.plan_id)
          .single();
        setSubscription(sub);
        setPlan(planData);
      } else {
        const { data: freePlan } = await supabase
          .from("plans")
          .select("*")
          .eq("name", "free")
          .single();
        setPlan(freePlan);
      }
      setLoading(false);
    })();
  }, [userId]);

  return { subscription, plan, loading };
}

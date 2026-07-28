import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

interface Plan {
  id: string;
  name: string;
  price_toman: number;
  billing_period: string;
  daily_message_limit: number;
  monthly_document_limit: number;
  monthly_content_limit: number;
  code_assistant_access: boolean;
  priority_queue: boolean;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  auto_renew: boolean;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  plan: Plan | null;
  loading: boolean;
  isPro: boolean;
  isUltra: boolean;
  isFree: boolean;
  refresh: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // دریافت subscription فعال
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (sub) {
        setSubscription(sub as Subscription);

        // دریافت plan مرتبط
        const { data: planData } = await supabase
          .from("plans")
          .select("*")
          .eq("id", sub.plan_id)
          .single();

        if (planData) {
          setPlan(planData as Plan);
        }
      } else {
        // بدون subscription فعال → Free
        const { data: freePlan } = await supabase
          .from("plans")
          .select("*")
          .eq("name", "free")
          .single();

        if (freePlan) {
          setPlan(freePlan as Plan);
        }
        setSubscription(null);
      }
    } catch (err) {
      console.error("Subscription fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    plan,
    loading,
    isPro: plan?.name === "pro",
    isUltra: plan?.name === "ultra",
    isFree: !plan || plan.name === "free",
    refresh: fetchSubscription,
  };
}

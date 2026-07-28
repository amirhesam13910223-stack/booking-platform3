import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface UsageQuota {
  dailyMessages: number;
  monthlyDocuments: number;
  monthlyContent: number;
  loading: boolean;
}

export function useUsageQuota(userId: string | undefined): UsageQuota {
  const [quota, setQuota] = useState<UsageQuota>({
    dailyMessages: 0,
    monthlyDocuments: 0,
    monthlyContent: 0,
    loading: true,
  });

  useEffect(() => {
    if (!userId) return;

    (async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count: msgCount } = await supabase
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("action_type", "message")
        .gte("created_at", todayStart.toISOString());

      const { count: docCount } = await supabase
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("action_type", "document")
        .gte("created_at", monthStart.toISOString());

      const { count: contentCount } = await supabase
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("action_type", "content")
        .gte("created_at", monthStart.toISOString());

      setQuota({
        dailyMessages: msgCount ?? 0,
        monthlyDocuments: docCount ?? 0,
        monthlyContent: contentCount ?? 0,
        loading: false,
      });
    })();
  }, [userId]);

  return quota;
}

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { QUOTA_WARNING_THRESHOLD } from "@/lib/constants";

interface UsageQuota {
  todayMessages: number;
  monthDocuments: number;
  monthContent: number;
  dailyMessageLimit: number;
  monthlyDocumentLimit: number;
  monthlyContentLimit: number;
  messagePercent: number;
  documentPercent: number;
  contentPercent: number;
  isNearLimit: boolean;
}

export function useUsageQuota(): UsageQuota & { loading: boolean; refresh: () => Promise<void> } {
  const { user } = useAuth();
  const { plan } = useSubscription();
  const [usage, setUsage] = useState({
    todayMessages: 0,
    monthDocuments: 0,
    monthContent: 0,
  });
  const [loading, setLoading] = useState(true);

  const dailyMessageLimit = plan?.daily_message_limit ?? 15;
  const monthlyDocumentLimit = plan?.monthly_document_limit ?? 3;
  const monthlyContentLimit = plan?.monthly_content_limit ?? 5;

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [msgRes, docRes, contentRes] = await Promise.all([
        supabase
          .from("usage_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("action_type", "message")
          .gte("created_at", todayStart.toISOString()),
        supabase
          .from("usage_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("action_type", "document")
          .gte("created_at", monthStart.toISOString()),
        supabase
          .from("usage_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("action_type", "content")
          .gte("created_at", monthStart.toISOString()),
      ]);

      setUsage({
        todayMessages: msgRes.count ?? 0,
        monthDocuments: docRes.count ?? 0,
        monthContent: contentRes.count ?? 0,
      });
    } catch (err) {
      console.error("Usage fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const messagePercent = dailyMessageLimit > 0
    ? Math.min(100, Math.round((usage.todayMessages / dailyMessageLimit) * 100))
    : 0;
  const documentPercent = monthlyDocumentLimit > 0
    ? Math.min(100, Math.round((usage.monthDocuments / monthlyDocumentLimit) * 100))
    : 0;
  const contentPercent = monthlyContentLimit > 0
    ? Math.min(100, Math.round((usage.monthContent / monthlyContentLimit) * 100))
    : 0;

  return {
    todayMessages: usage.todayMessages,
    monthDocuments: usage.monthDocuments,
    monthContent: usage.monthContent,
    dailyMessageLimit,
    monthlyDocumentLimit,
    monthlyContentLimit,
    messagePercent,
    documentPercent,
    contentPercent,
    isNearLimit: messagePercent >= QUOTA_WARNING_THRESHOLD * 100,
    loading,
    refresh: fetchUsage,
  };
}

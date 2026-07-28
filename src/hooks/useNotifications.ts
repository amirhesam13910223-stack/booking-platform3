import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const markAsRead = useCallback(
    async (id: string) => {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      await fetch();
    },
    [fetch]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    await fetch();
  }, [userId, fetch]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh: fetch };
}

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useCredits(userId: string | undefined) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      const { data } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", userId)
        .single();
      setBalance(data?.balance ?? 0);
      setLoading(false);
    })();
  }, [userId]);

  return { balance, loading };
}

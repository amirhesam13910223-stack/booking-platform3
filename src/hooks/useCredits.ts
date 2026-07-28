import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  created_at: string;
}

interface UseCreditsReturn {
  balance: number;
  transactions: CreditTransaction[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useCredits(): UseCreditsReturn {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Balance
      const { data: creditData } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      setBalance(creditData?.balance ?? 0);

      // Transactions
      const { data: txData } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (txData) {
        setTransactions(txData as CreditTransaction[]);
      }
    } catch (err) {
      console.error("Credits fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return { balance, transactions, loading, refresh: fetchCredits };
}

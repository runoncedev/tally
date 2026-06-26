import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

type GmailStatusContextValue = {
  gmailInvalid: boolean;
  setGmailInvalid: (v: boolean) => void;
};

const GmailStatusContext = createContext<GmailStatusContextValue>({
  gmailInvalid: false,
  setGmailInvalid: () => {},
});

export function GmailStatusProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [gmailInvalid, setGmailInvalid] = useState(false);

  useEffect(() => {
    supabase
      .from("user_oauth_tokens")
      .select("is_invalid")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => setGmailInvalid(data?.is_invalid ?? false));
  }, [userId]);

  return (
    <GmailStatusContext.Provider value={{ gmailInvalid, setGmailInvalid }}>
      {children}
    </GmailStatusContext.Provider>
  );
}

export function useGmailStatus() {
  return useContext(GmailStatusContext);
}

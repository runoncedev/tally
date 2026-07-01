import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "./Button";

export function GmailWatchButton() {
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.provider_token;
    if (!token) return;

    const loadingTimer = setTimeout(() => setLoading(true), 300);
    try {
      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/watch", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ topicName: "projects/tally-493920/topics/gmail", labelIds: ["INBOX"] }),
      });
      if (res.status === 401) {
        setStatus("error");
      } else {
        const data = await res.json();
        if (data.historyId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from("user_oauth_tokens")
              .update({ last_history_id: String(data.historyId) })
              .eq("user_id", user.id)
              .is("last_history_id", null);
          }
          setStatus("success");
        } else {
          setStatus("error");
        }
      }
    } catch {
      setStatus("error");
    }
    clearTimeout(loadingTimer);
    setLoading(false);
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="relative">
      <Button size="icon" title="Gmail watch" onClick={handleClick}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      </Button>
      <span className={`pointer-events-none absolute right-0.5 bottom-0.5 h-3.5 w-3.5 rounded-full transition-all duration-400 ${loading ? "bg-blue-500 opacity-100" : status === "success" ? "bg-green-500 opacity-100" : status === "error" ? "bg-red-500 opacity-100" : "bg-blue-500 opacity-0"}`}>
        {loading && <span className="absolute inset-0 animate-ping rounded-full bg-blue-500 opacity-75" />}
      </span>
    </div>
  );
}

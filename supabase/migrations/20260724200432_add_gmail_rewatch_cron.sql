-- Gmail's users.watch registration expires after a max of 7 days.
-- This cron re-registers the watch for every user with a still-valid
-- refresh token, so sync doesn't silently die if the user never logs
-- in again within that window.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- NOTE: this endpoint is currently unauthenticated (no shared secret check).
-- Revisit before relying on this long-term — see gmail-watch-cron/index.ts.
select cron.schedule(
  'gmail-rewatch',
  '0 3 * * *', -- daily at 03:00 UTC
  $$
  select net.http_post(
    url := 'https://glninciuilasqnrfzhaf.supabase.co/functions/v1/gmail-watch-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    )
  );
  $$
);

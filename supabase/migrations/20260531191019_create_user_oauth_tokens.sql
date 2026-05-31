create table user_oauth_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);

alter table user_oauth_tokens enable row level security;

create policy "users can manage their own token"
  on user_oauth_tokens
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

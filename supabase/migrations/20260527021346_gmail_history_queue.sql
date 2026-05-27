create table gmail_history_queue (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  history_id   text not null,
  received_at  timestamptz not null default now()
);

alter table gmail_history_queue enable row level security;

create policy "household members can access their gmail_history_queue"
  on gmail_history_queue
  for all
  using (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );

alter table email_transactions drop column history_id;

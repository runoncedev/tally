create table email_transactions (
  id               uuid primary key default gen_random_uuid(),
  household_id     uuid references households(id) on delete cascade not null,
  history_id       text not null,
  gmail_message_id text unique,
  "from"           text,
  amount           numeric,
  merchant         text,
  transacted_at    timestamptz,
  received_at      timestamptz not null default now(),
  deleted_at       timestamptz
);

alter table email_transactions enable row level security;

create policy "household members can access their email_transactions"
  on email_transactions
  for all
  using (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );

-- Add new columns to categories
alter table "public"."categories" add column "recurring" boolean not null default false;
alter table "public"."categories" add column "default_amount" integer;

-- Migrate data: mark categories as recurring based on existing transactions
update "public"."categories" c
set
  recurring = true,
  default_amount = t.amount
from (
  select distinct on (category_id) category_id, amount
  from "public"."transactions"
  where recurrent = true
  order by category_id, created_at desc
) t
where c.id = t.category_id;

-- Drop old columns from transactions
alter table "public"."transactions" drop constraint "transactions_recurring_source_id_fkey";
alter table "public"."transactions" drop column "recurrent";
alter table "public"."transactions" drop column "recurring_source_id";



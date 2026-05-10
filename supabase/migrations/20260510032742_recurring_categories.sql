alter table "public"."transactions" drop constraint "transactions_recurring_source_id_fkey";

alter table "public"."categories" add column "default_amount" integer;

alter table "public"."categories" add column "recurring" boolean not null default false;

alter table "public"."transactions" drop column "recurrent";

alter table "public"."transactions" drop column "recurring_source_id";



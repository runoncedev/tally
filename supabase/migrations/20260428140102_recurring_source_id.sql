alter table "public"."transactions" add column "recurring_source_id" uuid;

alter table "public"."transactions" add constraint "transactions_recurring_source_id_fkey" FOREIGN KEY (recurring_source_id) REFERENCES public.transactions(public_id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."transactions" validate constraint "transactions_recurring_source_id_fkey";



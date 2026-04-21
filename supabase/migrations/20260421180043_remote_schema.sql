alter table "public"."transactions" add column "public_id" uuid not null default gen_random_uuid();

CREATE UNIQUE INDEX transactions_public_id_key ON public.transactions USING btree (public_id);

alter table "public"."transactions" add constraint "transactions_public_id_key" UNIQUE using index "transactions_public_id_key";



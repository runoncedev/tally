alter table "public"."merchant_category_mappings" add column "public_id" uuid not null default gen_random_uuid();

CREATE UNIQUE INDEX merchant_category_mappings_public_id_key ON public.merchant_category_mappings USING btree (public_id);

alter table "public"."merchant_category_mappings" add constraint "merchant_category_mappings_public_id_key" UNIQUE using index "merchant_category_mappings_public_id_key";

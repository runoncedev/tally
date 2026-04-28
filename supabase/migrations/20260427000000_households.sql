-- Households (shared accounts)
CREATE TABLE "public"."households" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Members: which users belong to which household
CREATE TABLE "public"."household_members" (
  "household_id" uuid NOT NULL REFERENCES "public"."households"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("household_id", "user_id")
);

-- Add household_id to transactions and categories
ALTER TABLE "public"."transactions" ADD COLUMN "household_id" uuid REFERENCES "public"."households"("id") ON DELETE CASCADE;
ALTER TABLE "public"."categories" ADD COLUMN "household_id" uuid REFERENCES "public"."households"("id") ON DELETE CASCADE;

-- RLS on households
ALTER TABLE "public"."households" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."household_members" ENABLE ROW LEVEL SECURITY;

-- Helper function: returns household_ids the current user belongs to
CREATE OR REPLACE FUNCTION "public"."my_household_ids"()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT household_id FROM public.household_members WHERE user_id = auth.uid();
$$;

-- households policies
CREATE POLICY "members can read their household"
  ON "public"."households" FOR SELECT TO authenticated
  USING (id IN (SELECT public.my_household_ids()));

CREATE POLICY "members can update their household"
  ON "public"."households" FOR UPDATE TO authenticated
  USING (id IN (SELECT public.my_household_ids()));

-- household_members policies
CREATE POLICY "members can read household_members"
  ON "public"."household_members" FOR SELECT TO authenticated
  USING (household_id IN (SELECT public.my_household_ids()));

CREATE POLICY "members can insert themselves"
  ON "public"."household_members" FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Drop old open policies on transactions
DROP POLICY IF EXISTS "authenticated can read transactions" ON "public"."transactions";
DROP POLICY IF EXISTS "authenticated can insert transactions" ON "public"."transactions";
DROP POLICY IF EXISTS "authenticated can update transactions" ON "public"."transactions";
DROP POLICY IF EXISTS "authenticated can delete transactions" ON "public"."transactions";

-- New transactions policies scoped to household
CREATE POLICY "household members can read transactions"
  ON "public"."transactions" FOR SELECT TO authenticated
  USING (household_id IN (SELECT public.my_household_ids()));

CREATE POLICY "household members can insert transactions"
  ON "public"."transactions" FOR INSERT TO authenticated
  WITH CHECK (household_id IN (SELECT public.my_household_ids()));

CREATE POLICY "household members can update transactions"
  ON "public"."transactions" FOR UPDATE TO authenticated
  USING (household_id IN (SELECT public.my_household_ids()));

CREATE POLICY "household members can delete transactions"
  ON "public"."transactions" FOR DELETE TO authenticated
  USING (household_id IN (SELECT public.my_household_ids()));

-- Drop old open policies on categories
DROP POLICY IF EXISTS "authenticated can read categories" ON "public"."categories";
DROP POLICY IF EXISTS "authenticated can insert categories" ON "public"."categories";
DROP POLICY IF EXISTS "authenticated can update categories" ON "public"."categories";
DROP POLICY IF EXISTS "authenticated can delete categories" ON "public"."categories";

-- New categories policies scoped to household
CREATE POLICY "household members can read categories"
  ON "public"."categories" FOR SELECT TO authenticated
  USING (household_id IN (SELECT public.my_household_ids()));

CREATE POLICY "household members can insert categories"
  ON "public"."categories" FOR INSERT TO authenticated
  WITH CHECK (household_id IN (SELECT public.my_household_ids()));

CREATE POLICY "household members can update categories"
  ON "public"."categories" FOR UPDATE TO authenticated
  USING (household_id IN (SELECT public.my_household_ids()));

CREATE POLICY "household members can delete categories"
  ON "public"."categories" FOR DELETE TO authenticated
  USING (household_id IN (SELECT public.my_household_ids()));

-- Function: create a household and join it atomically
CREATE OR REPLACE FUNCTION "public"."create_household"(household_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.households (name) VALUES (household_name) RETURNING id INTO new_id;
  INSERT INTO public.household_members (household_id, user_id) VALUES (new_id, auth.uid());
  RETURN new_id;
END;
$$;

-- Function: join an existing household by id
CREATE OR REPLACE FUNCTION "public"."join_household"(target_household_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.household_members (household_id, user_id)
  VALUES (target_household_id, auth.uid())
  ON CONFLICT DO NOTHING;
END;
$$;

-- Backfill: create a household for the existing user and assign all data to it
DO $$
DECLARE
  v_user_id uuid;
  v_household_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.households (name) VALUES ('My Household') RETURNING id INTO v_household_id;
  INSERT INTO public.household_members (household_id, user_id) VALUES (v_household_id, v_user_id);

  UPDATE public.transactions SET household_id = v_household_id WHERE household_id IS NULL;
  UPDATE public.categories SET household_id = v_household_id WHERE household_id IS NULL;
END;
$$;

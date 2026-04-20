
  create policy "authenticated can delete categories"
  on "public"."categories"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "authenticated can insert categories"
  on "public"."categories"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "authenticated can read categories"
  on "public"."categories"
  as permissive
  for select
  to authenticated
using (true);



  create policy "authenticated can update categories"
  on "public"."categories"
  as permissive
  for update
  to authenticated
using (true);



  create policy "authenticated can delete transactions"
  on "public"."transactions"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "authenticated can insert transactions"
  on "public"."transactions"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "authenticated can read transactions"
  on "public"."transactions"
  as permissive
  for select
  to authenticated
using (true);



  create policy "authenticated can update transactions"
  on "public"."transactions"
  as permissive
  for update
  to authenticated
using (true);




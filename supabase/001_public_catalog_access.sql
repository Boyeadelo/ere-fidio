-- Run this once if the schema has already been created.
-- RLS policies control rows; these grants allow the API roles to query the table.
grant select on table public.products to anon, authenticated;

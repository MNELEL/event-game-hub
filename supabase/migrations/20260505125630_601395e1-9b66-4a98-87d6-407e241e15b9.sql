create table public.yemot_credentials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() unique,
  yemot_username text,
  yemot_api_token text not null,
  webhook_secret text not null default encode(gen_random_bytes(24), 'hex'),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.yemot_credentials enable row level security;

create policy "owner reads own yemot creds"
  on public.yemot_credentials for select to authenticated
  using (owner_id = auth.uid());

create policy "owner inserts own yemot creds"
  on public.yemot_credentials for insert to authenticated
  with check (owner_id = auth.uid());

create policy "owner updates own yemot creds"
  on public.yemot_credentials for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create trigger trg_yemot_credentials_updated_at
  before update on public.yemot_credentials
  for each row execute function public.update_updated_at_column();
create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  mpg_uk numeric(6, 2) not null check (mpg_uk > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name)
);

alter table public.cars enable row level security;

create policy "Users can view their own cars"
  on public.cars
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can add their own cars"
  on public.cars
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can edit their own cars"
  on public.cars
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own cars"
  on public.cars
  for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists cars_set_updated_at on public.cars;

create trigger cars_set_updated_at
before update on public.cars
for each row
execute function public.set_updated_at();

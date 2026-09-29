create table if not exists public.calculation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  description text check (description is null or char_length(trim(description)) <= 200),
  car_name text not null check (length(trim(car_name)) > 0),
  mpg_uk numeric(6, 2) not null check (mpg_uk > 0),
  nearby_price_pence numeric(8, 2) not null check (nearby_price_pence >= 0),
  away_price_pence numeric(8, 2) not null check (away_price_pence >= 0),
  distance_miles numeric(8, 2) not null check (distance_miles >= 0),
  litres numeric(8, 2) not null check (litres > 0),
  gross_saving numeric(10, 2) not null,
  travel_cost numeric(10, 2) not null,
  net_saving numeric(10, 2) not null,
  decision text not null check (decision in ('good', 'bad', 'even')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists calculation_history_user_created_idx
  on public.calculation_history (user_id, created_at desc);

alter table public.calculation_history enable row level security;

create policy "Users can view their own calculation history"
  on public.calculation_history
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can add their own calculation history"
  on public.calculation_history
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own calculation history"
  on public.calculation_history
  for delete
  to authenticated
  using (auth.uid() = user_id);

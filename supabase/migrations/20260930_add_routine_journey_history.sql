alter table public.calculation_history
  add column if not exists calculation_mode text not null default 'fuel_amount'
    check (calculation_mode in ('fuel_amount', 'routine_journey')),
  add column if not exists routine_distance_miles numeric(8, 2),
  add column if not exists baseline_cost numeric(10, 2),
  add column if not exists outbound_cost numeric(10, 2),
  add column if not exists return_cost numeric(10, 2),
  add column if not exists routine_away_cost numeric(10, 2),
  add column if not exists away_total_cost numeric(10, 2);

alter table public.calculation_history
  alter column litres drop not null;

alter table public.calculation_history
  add constraint calculation_history_routine_distance_check
    check (routine_distance_miles is null or routine_distance_miles > 0);

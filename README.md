# Petrol Cost

A small web app that compares the saving from cheaper petrol with the fuel cost of travelling to that station.

## Live site

[Open Petrol Cost](https://jeungjeung.github.io/petrol-cost/)

## Features

- Calculate fuel cost per mile using UK MPG.
- Compare a nearby petrol station with a cheaper station farther away.
- Show the gross saving, travel cost, net saving, and decision.
- Save, edit, select, and delete car profiles.
- Sign in and keep car profiles in Supabase.
- Use the calculator preview without signing in.

## Local development

Serve the project directory with any static web server, then open the local address in a browser. The app uses the Supabase values in `supabase-config.js`.

The Supabase database migration is in `supabase/migrations/20260929_create_cars.sql`. Apply it to a Supabase project before testing signed-in car storage.

## Tests

Run the calculation tests with:

```bash
npm test
```

## Deployment

The GitHub Actions workflow in `.github/workflows/deploy-pages.yml` deploys the `feature/PLAN-1` branch to GitHub Pages.

Only the Supabase publishable key belongs in browser code. Never add a Supabase service-role key or database password to the repository.

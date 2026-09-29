# Petrol Station Cost Comparison Tool

## Project status

**Current phase:** Planning

**Overall status:** Architecture selected; implementation not started

**Last updated:** 2026-09-29

## Objective

Build a tool that determines whether it is financially worthwhile to travel to a petrol station offering a lower fuel price, after accounting for the fuel used during the extra journey.

The tool will be delivered as a web app hosted on free services so it can be accessed through a web address.

## Deployment architecture

The project will separate the user interface from the data/backend services:

- **Front end:** static web application hosted on a free front-end platform
- **Backend and data:** Supabase, providing the database, API access, authentication options, and access rules
- **Custom application server:** not required for the initial version
- **Front-end technology:** vanilla HTML, CSS, and JavaScript
- **Supabase integration:** Supabase JavaScript client

The browser will communicate with Supabase directly. This keeps the first version small and avoids maintaining a separate backend server. Supabase Row Level Security and, if needed, user authentication must protect saved car data before the app is shared publicly.

## MVP scope

### Section 1: Saved car profiles

The tool should support multiple saved cars. The user can select an existing car before making a comparison.

Car profile fields:

- **Car name** — required identifier
- **MPG (UK)** — required; used to calculate fuel consumption and travel cost

Car-management actions:

- Add a new car
- View and select a saved car
- Switch between saved cars
- Modify the MPG of an existing car
- Rename an existing car
- Save changes so they are available in future sessions

The selected car is used for all calculations until the user switches to another car.

Outputs:

- **Fuel cost per mile**
- **Fuel cost for a specified distance**

### Section 2: Petrol station comparison

Inputs:

- **Nearby station price** — pence per litre
- **Away station price** — pence per litre
- **Distance to the away station** — one-way distance in miles
- **Amount of fuel purchased** — litres

For the MVP, the away station trip is assumed to be made solely to purchase fuel. The distance input is one-way, so the tool calculates the round trip as twice that distance.

Outputs:

- **Round-trip distance to the away station**
- **Fuel cost of the round trip**
- **Cost of the fuel at the nearby station**
- **Cost of the fuel at the away station**
- **Gross saving from the cheaper station**
- **Net saving after the travel cost**
- **Recommendation:** worthwhile, not worthwhile, or break-even

## Proposed interface flow

### 1. Authentication screen

- Email input
- Password input
- Sign-in button
- Sign-up option for creating the website account
- Sign-out action available after login

### 2. Main calculator screen

The main screen should keep the comparison task visible and compact:

- Selected car dropdown
- Add-car and edit-car actions
- Display of the selected car's UK MPG and cost per mile
- Nearby station price input
- Away station price input
- One-way distance input
- Litres to purchase input
- Calculate button
- Results panel with the recommendation and cost breakdown

### 3. Car management

Car management can initially use a modal or dedicated panel rather than a separate page:

- List of saved cars
- Add new car form
- Edit car name and MPG
- Select a car as the active car
- Delete-car action, with confirmation

### 4. Results presentation

The result should lead with a clear decision, followed by the supporting numbers:

```text
Worth travelling / Not worth travelling / Break-even

Net saving: £X.XX
Travel cost: £X.XX
Gross fuel saving: £X.XX
Round-trip distance: X miles
```

The interface should validate inputs before calculating and explain invalid values in plain language.

## Calculations

UK MPG uses an imperial gallon, which equals 4.54609 litres.

```text
Cost per mile = (petrol price per litre × 4.54609) ÷ UK MPG

Round-trip distance = one-way distance × 2

Travel cost = round-trip distance × cost per mile

Gross saving = (nearby price per litre − away price per litre) × litres purchased

Net saving = gross saving − travel cost
```

Decision rule:

```text
If net saving > 0: travelling is worthwhile
If net saving < 0: use the nearby station
If net saving = 0: break-even
```

All monetary values should be calculated accurately and displayed in pounds and pence. Station prices may be entered in pence per litre, but calculations should use a consistent unit internally.

## Assumptions

- The car's MPG value is UK/imperial MPG, not US MPG.
- Car profiles are saved and can be retrieved when the tool is used again.
- Each saved car has one current MPG value; changing it updates future calculations for that car.
- Petrol prices are expressed per litre.
- The away-station distance is one-way.
- The user is travelling to the away station specifically to buy fuel.
- The user provides the number of litres they intend to purchase.
- The comparison accounts only for fuel used during the trip; it does not include time, wear, parking, tolls, or other costs.
- A negative net saving means the cheaper station is not economically worthwhile to visit.

## Scope decisions

- Fuel quantity is required because the potential saving depends on how many litres are purchased.
- Saved car profiles and car switching are part of the initial product scope.
- The product is a web app.
- Supabase Free will provide the hosted database and backend services.
- The user interface will use vanilla HTML, CSS, and JavaScript rather than a front-end framework.
- Saved car profiles will be stored in Supabase rather than in a server-side file.
- The front end will be deployed as a static web app through GitHub Pages.
- The front end and backend/data services will be hosted separately.
- The project source code will be tracked with Git.
- The GitHub repository will be public for the MVP because GitHub Free requires public repositories for GitHub Pages.
- The initial version will use one website account for the owner, managed by Supabase Authentication.
- Car profiles will be private to the signed-in website account through Supabase Row Level Security.
- The website should keep the user signed in for a defined period, then require sign-in again.
- The MVP session period will be 30 days since the user's last use.
- The data design should leave room for additional users later.
- The MVP compares one nearby station with one away station.
- The MVP uses distance entered by the user rather than route planning or live map data.
- The car name is informational and does not affect calculations.
- The initial version assumes the full away-station journey is an additional trip.

## Future enhancements

These are deliberately outside the MVP:

- Break-even litres required for the away station to be worthwhile
- Maximum worthwhile one-way distance
- Support for multiple station comparisons
- Journey-purpose or detour mode, where only the additional distance is counted
- Live petrol prices
- Route planning and map integration
- Time cost, vehicle wear, tolls, and parking costs
- Support for different fuel types
- History of previous comparisons
- Migration from file-based storage to a database if the project needs to support multiple users or larger data volumes
- User accounts and sign-in

## Hosting and version-control assessment

### Chosen backend/data platform: Supabase Free

Supabase is selected for persistent car-profile data, database access, and future authentication. It is not the sole web-hosting solution for the project: the front-end files will need a separate static host.

### Chosen front-end host: GitHub Pages

GitHub Pages Free will publish the static front end from the public GitHub repository. The website itself is public, but Supabase access rules must protect saved data.

No Supabase secret key or service-role key may be committed to the repository. Only a publishable client key may be used in browser code, together with appropriate Supabase Row Level Security policies.

### Version control

The project should use Git from the beginning. Each meaningful change should be committed with a clear message. A remote repository is recommended for backup and deployment integration, but the provider has not yet been selected.

### Previous file-based option: PythonAnywhere free tier

PythonAnywhere provides a free web-app address, one web app, one web worker, and a 512 MiB disk quota. Its file storage is suitable for keeping a very small JSON file containing the saved car profiles. This matches the single-user prototype and avoids introducing a database.

The current free tier has important limits, including restricted outbound internet access and a stated one-month expiry for the free web app. This option is no longer the chosen architecture because Supabase provides more reliable persistence and a better path to cross-device access.

### Not recommended for the previous file-storage design

- **Render free web services:** suitable for hosting a web app, but their filesystem is ephemeral. File changes are lost when the service restarts, redeploys, or spins down.
- **Static-only hosting:** suitable for the front end, but cannot accept requests that update a server-side file.

### Other viable managed-data options

- **Cloudflare D1:** serverless SQLite-style database with a current free allowance of 5 GB storage, 5 million rows read per day, and 100,000 rows written per day. It is attractive if the entire app is hosted on Cloudflare, but it requires Cloudflare Workers development.
- **Firebase Firestore:** managed document database with a free quota of 1 GiB storage, 50,000 reads per day, 20,000 writes per day, and 20,000 deletes per day. It is convenient for a browser-first app, but its document/query model is different from a simple relational database.
- **Neon:** hosted Postgres with a free plan offering 0.5 GB storage per project and scale-to-zero compute. It is a database rather than a complete backend, so the app would still need a serverless API layer and authentication strategy.

## Implementation status

- [x] Define the product objective
- [x] Define saved car profiles and car-management actions
- [x] Define the global car inputs and outputs
- [x] Define the station comparison inputs and outputs
- [x] Define the calculation formulas
- [x] Document assumptions and MVP boundaries
- [x] Choose vanilla HTML, CSS, and JavaScript for the front end
- [x] Decide on a web-app delivery model
- [x] Choose Supabase for hosted data and backend services
- [x] Choose GitHub Pages for static front-end hosting
- [x] Decide to separate front-end hosting from backend/data hosting
- [ ] Initialize the Git repository
- [x] Choose GitHub as the remote Git provider
- [ ] Create the public GitHub repository and connect it
- [x] Design and approve the user interface
- [x] Create the initial vanilla web-app scaffold
- [x] Choose hosted database storage
- [x] Choose Supabase website authentication for the MVP
- [x] Design and approve the Supabase database schema and Row Level Security policies
- [x] Design the website login and sign-up flow
- [x] Choose a 30-day website session duration
- [x] Verify website account creation and sign-in in the local preview
- [x] Apply the `cars` table migration to the Supabase project
- [x] Connect car retrieval and saving to Supabase
- [x] Implement and test car deletion from Supabase
- [x] Implement adding, retrieving, selecting, renaming, and editing cars
- [x] Implement the global car calculation using the selected car
- [x] Implement the station comparison calculation
- [x] Add validation and edge-case handling
- [x] Add automated tests for calculation accuracy
- [ ] Perform a usability review
- [ ] Prepare the first usable release

## Open decisions before implementation

1. Should the user enter petrol prices in pence per litre, with the interface displaying pounds where appropriate?
2. Should the MVP include the break-even litres and maximum worthwhile distance calculations?
3. Should the tool support a detour mode from the beginning, or only the dedicated round-trip scenario?

## Supabase storage note

The database should separate car profiles by an owner identifier, even if the first version has only one user. Access rules must prevent unauthorised users from reading or changing saved cars before the app is made public.

## Session persistence note

Supabase JavaScript clients persist browser sessions by default and refresh short-lived access tokens automatically. Supabase sessions last indefinitely by default. Supabase's server-enforced time-boxed session lifetime and inactivity timeout controls require a paid plan, so the free-tier MVP may implement a client-side session expiry for the desired period and sign the user out locally when it expires.

The MVP duration is 30 days since last use. If stronger server-side enforcement is required later, the project can move to a paid Supabase plan or add a more controlled authentication layer.

## Proposed Supabase schema

### `cars` table

Each saved car belongs to one website account.

| Column | Type | Purpose |
|---|---|---|
| `id` | UUID | Unique car identifier |
| `user_id` | UUID | References the signed-in Supabase user |
| `name` | Text | Car name |
| `mpg_uk` | Numeric | UK MPG value |
| `created_at` | Timestamp | Creation time |
| `updated_at` | Timestamp | Last modification time |

The calculator should derive cost per mile, travel cost, gross saving, and net saving from the selected car and current comparison inputs. These calculated values do not need to be stored.

### Row Level Security

Row Level Security should be enabled on `cars` with policies allowing a user to:

- Read only rows where `user_id` matches the signed-in user's ID
- Add rows only with their own user ID
- Edit only their own rows
- Delete only their own rows

The `user_id` value should be assigned from the authenticated session rather than trusted from an unrestricted form input.

### Validation rules

- Car name must not be blank.
- UK MPG must be a positive number.
- Car names should be unique per user, unless we decide to allow duplicate names.
- Deleting a car should require confirmation.
- The app should prevent deleting the currently selected car if it is the user's only saved car, or clearly handle the empty-car state.

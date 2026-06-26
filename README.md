<p align="center"><img src="./client/public/CavAppsLogo.svg" width = 400em></p>

## Overview

[![Production Deployment](https://github.com/7Cav/adr/actions/workflows/prod_deploy.yml/badge.svg)](https://apps.7cav.us/)
[![Development Deployment](https://github.com/7Cav/adr/actions/workflows/dev_deploy.yml/badge.svg)](https://beta.apps.7cav.us/)

7th Cavalry Apps (CavApps) is a Nextjs based collection of tools and apps designed to aid the 7th Cavalry Gaming Regiment in its day to day functions. In its current form, CavApps currently includes the Active Duty Roster (ADR) and a small collection of Roster Statistics. Future iterations of CavApps can include a more advanced statistics tool, an AWOL tracker, and a potential migration of S1 Documents among other possible tools. CavApps is currently structured as a Frontend-Backend architecture and includes basic authentication for enhanced security.

The live deployment can be found at https://apps.7cav.us/ and the backend at https://bff.apps.7cav.us/

**NOTE:** This documentation is written so that an average member of the 7th Cavalry <em>should</em> be able to make basic edits to CavApps. If you need help with a particular matter or believe this documentation could be improved, please message S6 Development Staff on Discord or on the Forums.

## Table of Contents

- [Running Locally](#running-locally)
  - [Quick Start with Docker (recommended)](#quick-start-with-docker-recommended)
  - [Requirements](#requirements)
    - [Authorization](#authorization)
  - [Manual Setup (without Docker)](#manual-setup-without-docker)
- [Updating the ADR](#updating-the-adr)
  - [Add New Billet in Existing Category](#add-new-billet-in-existing-category)
  - [Add New Category](#add-new-category)
  - [Files to Update](#files-to-update)
- [Server Deployment](#server-deployment)
  - [Requirements](#requirements-1)
- [Roster Statistics](#roster-statistics)
- [Future Goals](#future-goals)

## Running Locally

CavApps is a monorepo with two parts:

- **`server/`** — an Express caching proxy ("BFF") that fetches roster data from the 7th Cavalry API and serves it from memory. It also keeps a Postgres database for roster-history diffs and the user-search cache.
- **`client/`** — a Next.js 13 (App Router) app with three tools: the Active Duty Roster (ADR), Roster Statistics, and the Uniform Builder.

The client never talks to the 7th Cavalry API directly — it only talks to the server. The Docker setup below brings the Postgres database up for you, so there's nothing extra to install.

### Authorization

You need two tokens:

| Token          | Purpose                                                                                                             | Where it goes           |
| -------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `API_TOKEN`    | Authenticates the **server** to `api.7cav.us`. A real 7th Cavalry API bearer.                                       | server env              |
| `CLIENT_TOKEN` | Shared secret between the **client and server**. Can be any string you choose — it just has to match on both sides. | server env + client env |

To get your `API_TOKEN`:

1. Log into your [7th Cavalry Gaming](https://7cav.us/) account (member-level, not a public account).
2. Open your [Connected Accounts](https://7cav.us/account/connected-accounts/) and click "view account" for `auth.7cav.us`.
3. Log into Keycloak and copy the provided API token.

> **Heads up on `.env` formatting:** use `KEY=value` with **no spaces around the `=`** and no surrounding quotes. A line like `API_TOKEN ='abc'` (note the space) makes the variable name `API_TOKEN ` (with a trailing space), so Docker Compose treats `API_TOKEN` as unset and the server fails to load the roster on startup, then crash-loops instead of coming up.

### Quick Start with Docker (recommended)

This is the fastest way to get a working dev environment — it builds and runs both the server and client for you, with hot-reload on the client.

1. Install [Docker](https://docs.docker.com/get-docker/) (Docker Desktop on macOS/Windows).
2. In the project root, copy the example env file and fill in your tokens:

   ```bash
   cp .env.example .env
   ```

   At a minimum set `API_TOKEN` and `CLIENT_TOKEN`. Everything else has a sensible local default — the Postgres database is created for you, and the XenForo settings can stay blank (see the notes in `.env.example`).

3. Bring the stack up:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up
   ```

That's it. The override file (`docker-compose.dev.yml`) provisions the `edge` network locally, so **no manual `docker network create` is needed**. When it finishes:

- Client (CavApps index): http://localhost:3000
- Server (BFF): http://localhost:4000

The server must successfully load roster data on startup or it will exit and restart — if it keeps restarting, double-check your `API_TOKEN` (see the formatting note above).

> **Two features need the forum database.** The roster-history diff viewer and the member search box read from the live XenForo (forum) MariaDB, which you won't have locally. The diff viewer just stays empty; the member search returns an error if you use it, since its index is never built. The rest of the app works fine. To enable them, set the `XENFORO_DB_*` values in your `.env` to a reachable XenForo database.

Stop the stack with `Ctrl+C`, or from another terminal:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

> `docker-compose.yml` on its own is the **production** config and expects an externally managed `edge` network. For local dev always include the `-f docker-compose.dev.yml` override.

### Requirements

If you'd rather run the apps directly on your machine instead of in Docker:

- A valid [7th Cavalry Gaming](https://7cav.us/) account with member-level privileges.
- [Node.js](https://nodejs.org/en) v18+.
- Your choice of IDE such as [VSCode](https://code.visualstudio.com/) or [neoVim](https://neovim.io/).

### Manual Setup (without Docker)

You'll run the server and client in two separate terminals. The server also needs a Postgres database — if you don't already have one, the easiest path is to run just that container from the compose file:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up postgres
```

That gives you a database reachable at `postgres://cavapps:cavapps@localhost:5432/cavapps`. (This URL and the `DATABASE_URL` below assume the default `PG_PASSWORD=cavapps`; update both if you set your own.) The Docker Quick Start above avoids all of this; only use manual setup if you specifically need the apps running outside Docker.

**1. Server** (`server/`):

```bash
cd server
npm install
API_TOKEN=your-7cav-api-token \
CLIENT_TOKEN=any-shared-secret \
DATABASE_URL=postgres://cavapps:cavapps@localhost:5432/cavapps?sslmode=disable \
node server.js
```

The server listens on `http://localhost:4000`. Visiting it in a browser confirms it's up. It reads these values from the environment — export them in your shell or use a tool like [`dotenv`](https://www.npmjs.com/package/dotenv) / a `.env` loader of your choice. It runs its database migrations on startup and exits if `DATABASE_URL` isn't reachable.

**2. Client** (`client/`):

Create `client/.env.local` with:

```dotenv
NEXT_PUBLIC_CLIENT_TOKEN=any-shared-secret-you-choose
COMBAT_API_URL=http://localhost:4000/roster/combat
RESERVE_API_URL=http://localhost:4000/roster/reserves
GROUP_API_URL=http://localhost:4000/roster/groups
CACHE_TIMESTAMP_URL=http://localhost:4000/cache-timestamp
NEXT_PUBLIC_INDIVIDUAL_API_URL=http://localhost:4000/roster/individual
NEXT_PUBLIC_DIFF_API_URL=http://localhost:4000
NEXT_PUBLIC_USERCACHE_API_URL=http://localhost:4000/userSearch
```

`NEXT_PUBLIC_CLIENT_TOKEN` **must match** the server's `CLIENT_TOKEN`. Then:

```bash
cd client
npm install
npm run dev
```

Open http://localhost:3000 and you should see the CavApps index page. Happy coding!

For further documentation on Next.js, visit https://nextjs.org/docs

## Before Starting

> **Important:** The ADR and the [Roster Statistics](#roster-statistics) page are driven by **different** files. The ADR reads billet groups by index from `client/app/adr/page.jsx`; Roster Statistics reads billet IDs from `BilletBank.jsx`. A new billet or unit usually needs to be added in **both** places (and, for the regiment chart, a matching color). See [Files to Update](#files-to-update) for the full list.

## Updating the ADR

Since the ADR sources its data from the 7th Cavalry API and compares the API against a predefined billet list, the ADR is not aware when new billets are created or when older billets are moved.

For example, if a new company in 2-7 is created, the list the ADR compares against needs to be updated in order to display the membership of the new company.

The ADR works in terms of **billet groups**: selecting a group pulls in every billet inside it (e.g. selecting the C/ACD group brings in 1/C/ACD, 3/2/C/ACD, and so on). Each group is selected by its index in the API's `/roster/groups` response.

### Add New Billet in Existing Category

To add a new billet to an existing category, you need to update the `page.jsx` file located in `cavapps/client/app/adr`.

#### Step-by-Step Instructions

1. Open `page.jsx`.
2. Locate the `units` entry that corresponds to the category where you wish to add the new billet.
3. Append the index (referred to as 'ID') of the billet group to that entry's `selectors` array. (A group's index is its position in the `/roster/groups` response. Query that endpoint with your `CLIENT_TOKEN` as the `Authorization` header to find it.)

#### Example:

Suppose you want to add a new billet group with an ID of `28` to the "Information Management Office Command" category. Locate its `units` entry and append `28` to its `selectors` as follows:

##### Before:

```javascript
{ title: "Information Management Office Command", selectors: ["5", "9"] },
```

##### After:

```javascript
{ title: "Information Management Office Command", selectors: ["5", "9", "28"] },
```

---

### Add New Category

To introduce a new category, the `units` array in `page.jsx` located in `cavapps/client/app/adr/page.jsx` needs to be updated.

#### Step-by-Step Instructions

1. **In `adr/page.jsx`:**
   - Add a new entry to the `units` array with a `title` for the new category.
   - Populate its `selectors` array with the ID of each billet group that belongs under it. (A group's ID is its position in the `/roster/groups` response.)
   - Place the entry where you want it to appear. `units` render in array order.

#### Example:

You have been assigned the task of creating an entry in the ADR for 3rd Battalion. It has 3 companies, Alpha Bravo and Charlie. Each has its own billet group in the API, returned at IDs `12`, `13`, and `14`.

**In `adr/page.jsx`:**

```jsx
// each number is the ID of a billet group in the /roster/groups response
...
const units = [
    { title: "First Battalion", selectors: [2, 3, 4, 5, 6] },
    { title: "Second Battalion", selectors: [7, 8, 9, 10, 11] },
    { title: "Third Battalion", selectors: [12, 13, 14] },
    ...
];
```

> Note: Ensure that you add these elements in the proper locations in `page.jsx` to maintain the formatting.

### Files to Update

Because the ADR and Roster Statistics are driven separately, adding a billet or unit so it shows up **everywhere** means touching all of the following. Find the billet group's ID and its billet IDs first by querying `/roster/groups` (with your `CLIENT_TOKEN` as the `Authorization` header).

1. **`client/app/adr/page.jsx`**: the ADR. Add the billet group's ID to a `units` entry's `selectors` (existing category) or add a new `units` entry (new category), as shown above.
2. **`client/app/reusableModules/BilletBank.jsx`**: the data behind Roster Statistics. Add the billet ID to the matching array (existing category), or add new arrays + a group object for a new category, and export them at the bottom of the file.
3. **`client/app/rosterstatistics/page.jsx`**: the Statistics layout. Add the unit to the relevant `<Statistics>` block's `billetIDs` and add a matching label to its `labelArray` (the two must stay the same length and order).
4. **`client/app/rosterstatistics/modules/statistics.jsx`**: the chart colors. The regiment-wide chart colors its segments by position from a fixed `colors` array; if you added a segment to the regiment `billetIDs`, add a matching color here or the new segment renders with none.

> **Note:** The billet IDs in `BilletBank.jsx` are a hardcoded snapshot and drift as billets are created or moved. The ADR avoids this by reading the API live; Statistics does not, so its lists need occasional refreshing against `/roster/groups`.

## Server Deployment

**NOTE:** If you are making changes to CavApps and want said changes put on the live version, submit a pull request. This section is intended for S6 Staff for deployment testing purposes.

### Requirements

In order to deploy CavApps on a server, you need the following:

- A linux (preferably ubuntu) based server with the following:
  - Access via SSH
  - Sudo level permissions
  - Minimum 2GB RAM
- Alongside the following packages:
  - [Docker Engine](https://docs.docker.com/engine/install/ubuntu/)
  - nodejs
  - npm
  - git

  ```
  sudo apt install git npm nodejs
  ```

- A 7th Cavalry API token (see [Authorization](#authorization))

---

### Deployment

Once the required packages are installed, clone the repo

```
git clone https://github.com/Vercin-G/CavApps-Test
```

First, install prerequisites:

In `CavApps-Test/server/`:

```
npm install
```

In `CavApps-Test/client/`:

```
npm install
```

Next, create a `.env` file in the project root from the template and fill in your tokens (see [Authorization](#authorization)):

```bash
cp .env.example .env
```

The `docker-compose.yml` wires the client to reach the server over the internal Docker network (`http://server:4000/...`), so you do **not** need to set the per-URL client variables by hand for a Docker deployment — they're defined in the compose file. It also brings up the Postgres database the server depends on.

Then, from the project root:

```bash
docker compose up
```

> Production `docker compose up` (without the dev override) expects an externally managed `edge` network — create it once with `docker network create edge` if it doesn't already exist on the host.

And you should be good! Simply navigate to your server in your browser and the index page should show. The server side should be accessable via port 4000.

**NOTE:** On slower servers, the generation of nextjs static pages may cause a hang. This is normal. Give it a few seconds.

## Roster Statistics

The Roster Statistics section is currently pending rewrite to include more information. Stay Tuned!

Unlike the ADR, Roster Statistics reads its billet IDs from the `BilletBank.jsx` file located in `cavapps/client/app/reusableModules`.

### Add New Billet in Existing Category

To add a new billet to an existing category, append the new billet ID to the matching array.

#### Example:

Suppose you want to add a new billet with an ID of `28` to the "Information Management Office Command" category. Update `imoCommand` as follows:

##### Before:

```javascript
const imoCommand = ["5", "9"];
```

##### After:

```javascript
const imoCommand = ["5", "9", "28"];
```

---

### Add New Category

To introduce a new category, both `BilletBank.jsx` and `rosterstatistics/page.jsx` located in `cavapps/client/app/rosterstatistics/page.jsx` need to be updated.

#### Step-by-Step Instructions

1. **In `BilletBank.jsx`:**
   - Add a new array for each subcategory and populate it with the requred billet IDs.
   - Add a new object for the new category and append the subcategories as well as their titles to the new object. additionally, add a `collapsibleTitle` with the name of the new category into the object.
   - Add the new object to the billetbank object at the bottom of the file, and add the new arrays to the `billetBank` export list below it so the Statistics page can reach them.

2. **In `rosterstatistics/page.jsx`:**
   - Add a new `<Statistics>` block for the category, listing the new arrays in `billetIDs` with a matching `labelArray` of the same length and order.

3. **In `rosterstatistics/modules/statistics.jsx`:**
   - If the category also appears in the regiment-wide chart (the one combining every unit), add a color for each new segment to that chart's `colors` array. It is positional, so add the colors in the same order as the segments. Segments with no color render blank. (The per-battalion charts use a separate cycling palette and need no change.)

#### Example:

You have been assigned the task of creating an entry for 3rd Battalion. It has 3 companies, Alpha Bravo and Charlie. Each have their own designated billet IDs. In a live setting, each company can have strings that are dozens of entries each in length.

**In `BilletBank.jsx`:**

```jsx
//3-7

const threeSevenCommand = ['1', '2', '3'] //placeholder values
const alpha3 = ['4','5','6']
const bravo3 = ['7','8','9']
const charlie3 = ['10','11','12']

const threeSeven = {
    positionIds: [threeSevenCommand, alpha3, bravo3, charlie3],
    positionTitles: [
        "3-7 Headquarters",
        "Alpha Company",
        "Bravo Company",
        "Charlie Company",
    ],
    collapsibleTitle: "Third Battalion",
};

...

const billetBankObject = {
    regi: regi,
    oneSeven: oneSeven,
    twoSeven: twoSeven,
    threeSeven: threeSeven,
    ...
};
```

**In `rosterstatistics/page.jsx`:**

```jsx
<Statistics
  billetIDs={[
    lists.threeSevenCommand,
    lists.alpha3,
    lists.bravo3,
    lists.charlie3,
  ]}
  centerLabel="Total 3-7 Strength"
  labelArray={[
    "3-7 Headquarters",
    "Alpha Company",
    "Bravo Company",
    "Charlie Company",
  ]}
  milpacArray={milpacArray}
/>
```

**In `rosterstatistics/modules/statistics.jsx`** (only if 3rd Battalion is shown in the regiment-wide chart, which it is as it is a line billet battalion):

```jsx
// add one color per new segment, in the same order they appear in that chart's billetIDs
colors: [
    // ...existing colors...
    "#5bcefa",  // 3-7 HQ
    "#5bcefa",  // Alpha 3-7
    "#5bcefa",  // Bravo 3-7
    "#5bcefa",  // Charlie 3-7
],
```

> Note: Ensure that you add these elements in the proper locations to maintain the formatting.

## Future Goals

CavApps has several goals in mind for the future. Here are some examples.

- Roster Statistics which draw from a 7th Cavalry Operated database. Providing historical numbers on top of current figures
- Implementation of an AWOL tracker
- Implementation of keycloak systems to allow for the operation of internal documents. E.g. moving S1 spreadsheets into internal tools which are authenticated by keycloak.

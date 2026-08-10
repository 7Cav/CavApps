# Medal Recommendation Aid

Most of the Medal Recommendation Aid is contained under:

```text
client/app/medalrecommendation/
```

There are a few changes outside that folder that were needed for roster access, testing, and the landing page assets.

## Changes Outside This Folder

### `client/package.json` / `client/package-lock.json`

Added Vitest and the test scripts used by the Medal Recommendation Aid regression tests.

```json
"test": "vitest run",
"test:watch": "vitest"
```

Vitest is included under `devDependencies`. The normal CavApps `next dev` command is unchanged.

### `client/public/assets/medal-recommendation/`

Contains the two images used on the Medal Recommendation Aid landing page.

### `server/controllers/medalRosterCache.js`

This builds the eligible roster used by the Medal Recommendation Aid.

The existing CavApps Combat and Reserve caches are reused. The Medal Aid also needs ELOA and Retired members, so this controller pulls those separately and filters the Past Members roster to members whose primary position is `RETIRED`.

The ELOA and Retired results are cached for one hour so the application is not constantly hitting those API endpoints.

I kept this separate from the existing `cacheManager.js` because I did not want to change shared roster behavior for the other CavApps.

### `server/controllers/mRequest.js`

Small controller that serves the Medal-eligible roster to the client. If the roster cannot be retrieved, it returns a `503` rather than sending an incomplete roster.

### `server/routes/index.js`

Adds the Medal roster controller and one new endpoint:

```js
router.get("/medal-eligible", mRequest);
```

No existing routes were removed or changed.

## Overall

The only existing shared files changed are:

```text
client/package.json
client/package-lock.json
server/routes/index.js
```

Everything else outside the main Medal folder is either a new Medal-specific server file or a Medal-specific asset.

I intentionally tried to keep the impact on the rest of CavApps as small as possible. The pull of "Non-Eligible Members" is an edge case design for 'appreciation' medals being written up shortly after a member has been processed into retirement/reserves/ELOA. If S6 would rather handle the ELOA/Retired roster data through an existing shared service, that part can be changed without affecting the Medal Recommendation Aid's citation or validation logic.

# CacheShowdown

Interactive app that teaches HTTP cache headers to complete beginners. Each lesson has a live demo where a real `fetch()`
goes through the browser's real HTTP cache, and the UI shows what the cache did.

- `API/`: ASP.NET Core minimal API (.NET 10), http://localhost:5201
- `app/`: TanStack Start (React 19, file-based routing, Tailwind v4), http://localhost:3000

## Commands

```bash
cd API && dotnet run --launch-profile http   # backend
cd app && npm run dev                        # frontend (proxies /api → :5201)
cd app && npx tsc --noEmit && npm run lint   # type check + lint (run both before finishing)
cd app && npx prettier --write src           # format (no semicolons, single quotes)
cd app && npm run build                      # production build
docker compose up -d --build                 # both services in containers (app: vite preview, API_URL=http://api:8080)
docker compose down
```

There are no automated tests. Verify behaviour in a real browser (e.g. Playwright MCP): click **Send request** in a lesson
and check the outcome badges.

## The core trick (read this before changing demo logic)

JavaScript cannot inspect the browser cache, so the outcome of each click is inferred:

1. `app/src/lib/api.ts` `sendDemoRequest` does a plain `fetch()` (respecting the `cache` mode option).
2. The API logs every request that reaches it (`API/RequestLog.cs`) and puts a per-session `requestNumber` in each 200 body.
3. `app/src/hooks/useDemoSession.ts` reads `/api/session/{id}/log` right after the fetch, and again ~800 ms later after a
   cache hit to catch background (stale-while-revalidate) requests.
4. `app/src/lib/classify.ts` maps that to an `Outcome`: `cache` (no new log entry), `revalidated` (304 entry),
   `downloaded` (200 entry matching the body), `stale-revalidating` (entry appeared only after fetch resolved).

Things that follow from this:
- `fetch()` never exposes a 304; it reports 200 with the cached body. The server log is the source of truth.
- Each `DemoPanel` has its own session id in the URL (`?session=`), so "Reset" = new URL = empty cache entry.
- The API adds 300 ms fake latency (`SimulatedLatency`) so cache hits are visibly faster. The classifier's timing relies on it.
- `app/src/lib/freshness.ts` + `FreshnessBar` only *model* the cached copy's age; after a 304 or background refresh the
  freshness clock restarts from the log entry time, not the body's `serverTime`.
- `vite.config.ts` sets `server.cors: false`; otherwise Vite adds `Vary: Origin` to proxied responses and breaks the Vary lesson.

## Backend layout

- `API/Scenarios.cs`: scenario name → headers (`max-age`, `etag`, `swr`, `vary`, …). Add a scenario here to add a demo.
- `API/DemoEndpoints.cs`:
  - `GET /api/demo/{scenario}?session=` and `GET /api/playground?session=` (headers come from the session's playground config)
  - Conditional requests (`If-None-Match` takes precedence over `If-Modified-Since`) are evaluated by hand, so learners can
    read the logic. Each log entry gets a plain-English `note`.
  - `/api/session/{session}/…` (log, change-resource, playground config GET/PUT, DELETE) is UI plumbing, always `no-store`
    and not logged.
- State is in memory only (singleton `RequestLog`); restarting the API clears everything.

## Frontend layout

- `src/lessons/registry.ts`: ordered list of all pages (drives the sidebar, prev/next links and `/lessons/$slug`).
  Add a lesson = write `src/lessons/<Name>.tsx` + one `lesson(...)` entry here.
- `src/lessons/*.tsx`: lesson content. Pattern: explanation → `HttpMessage` example → `Callout kind="try"` →
  `<DemoPanel scenario="..." headers={[...]} />` → `Callout kind="notice"`.
- `src/components/`: `DemoPanel` (buttons + diagram + freshness bar + timeline), `CacheFlowDiagram`, `FreshnessBar`,
  `RequestTimeline`, `HeaderView`, `Prose` (`P`, `H2`, `C`, `HttpMessage`, `Directives`…), `Callout`, `Sidebar`, `PageLayout`.
- `src/lib/headerDocs.ts`: tooltip text for headers and `Cache-Control` directives.
- `src/routeTree.gen.ts` is generated (by `npm run dev` / `npm run generate-routes`); don't edit it by hand.
- Imports use the `#/` alias for `src/`.
- Anything browser-only (session ids, `localStorage`) must run in `useEffect`: pages are server-rendered.

## Writing style for lesson text

The audience knows nothing about HTTP caching. Use plain language and everyday analogies, define every term on first
use, and be accurate about browser behaviour (e.g. Chromium keeps one `Vary` variant per URL). Keep claims consistent
with what the live demo actually shows.

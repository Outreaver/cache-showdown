# CacheShowdown

An interactive app for learning HTTP cache headers (`Cache-Control`, `ETag`, `Last-Modified`, `Expires`, `Vary`, …) from scratch.
Each lesson has a live demo: press **Send request** and see whether the browser's real HTTP cache answered on its own,
revalidated with a `304 Not Modified`, or downloaded everything again.

## Run it

You need the .NET 10 SDK and Node.js.

```bash
# Terminal 1: the API on http://localhost:5201
cd API
dotnet run --launch-profile http

# Terminal 2: the frontend on http://localhost:3000
cd app
npm install
npm run dev
```

Open http://localhost:3000. The Vite dev server proxies `/api` to the API, so everything is same-origin.

> If DevTools is open, make sure **Network → "Disable cache"** is unticked, or nothing will ever come from the cache.

## How it works

JavaScript can't look inside the browser cache, so:

- The frontend calls a plain `fetch()`, which goes through the real HTTP cache.
- The API (`API/DemoEndpoints.cs`) logs every request that actually reaches it, including conditional headers
  like `If-None-Match`, and whether it answered `200` or `304`. It also adds ~300 ms of fake latency.
- After each click the frontend compares what `fetch()` returned with the server log
  (`app/src/lib/classify.ts`): no new log entry means a cache hit, a `304` entry means revalidation, and so on.

Scenarios (the headers each demo sends) are defined in `API/Scenarios.cs`; lesson texts live in `app/src/lessons/`.

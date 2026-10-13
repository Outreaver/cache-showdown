import { Callout } from '#/components/Callout'
import { Bullets, C, Directives, H2, P } from '#/components/Prose'

const recipes: Array<{
  what: string
  example: string
  header: string
  why: string
}> = [
  {
    what: 'Files with a hash in the name',
    example: 'app.3f9a1c.js, logo.8b2e.svg',
    header: 'public, max-age=31536000, immutable',
    why: 'The URL changes whenever the content changes, so a copy can live forever.',
  },
  {
    what: 'HTML pages / entry points',
    example: 'index.html',
    header: 'no-cache',
    why: 'Must always be current (it points to the latest JS/CSS), but a 304 is still cheap. Send an ETag.',
  },
  {
    what: 'Public data that can be a bit old',
    example: '/api/products, /api/news',
    header: 'public, max-age=60, stale-while-revalidate=300',
    why: 'Fast for everyone. Usually under a minute behind; at worst about 6 minutes (60 s fresh + 300 s stale-while-revalidate).',
  },
  {
    what: 'The current user’s data',
    example: '/api/me, /api/cart',
    header: 'private, no-cache',
    why: 'Only their browser keeps it, and always checks first. Send an ETag for cheap 304s.',
  },
  {
    what: 'Sensitive data',
    example: '/api/bank/balance, one-time tokens',
    header: 'no-store',
    why: 'Never written to the HTTP cache or a CDN, so nothing ends up on disk.',
  },
  {
    what: 'Files without a hash that rarely change',
    example: '/favicon.ico, /robots.txt',
    header: 'max-age=86400',
    why: 'A day is a reasonable compromise between speed and getting updates out.',
  },
]

const glossary: Array<[string, string]> = [
  ['Cache', 'A place that keeps copies of responses so they can be reused.'],
  ['Private cache', 'Belongs to one user, e.g. the browser’s HTTP cache.'],
  ['Shared cache', 'Serves many users, e.g. a CDN or proxy.'],
  [
    'Cache key',
    'What a cache looks a copy up by: the URL (+ method, + any headers listed in Vary). Modern browsers also split their cache by the site you are on, so the same URL embedded on two different sites is stored twice.',
  ],
  [
    'Fresh',
    'Younger than its lifetime (max-age / Expires). Can be used without asking the server.',
  ],
  [
    'Stale',
    'Older than its lifetime. Needs revalidation (unless stale-while-revalidate allows it).',
  ],
  [
    'Validator',
    'Something to check a copy against: an ETag or a Last-Modified date.',
  ],
  [
    'Revalidation',
    'Asking the server "is my copy still current?" with If-None-Match / If-Modified-Since.',
  ],
  [
    '304 Not Modified',
    'The server’s answer when the copy is still current. No body.',
  ],
  [
    'Cache busting',
    'Changing a URL (e.g. adding a hash) to force everyone to fetch the new version.',
  ],
]

export function CheatSheet() {
  return (
    <>
      <H2>Recipes: what to send for what</H2>
      <div className="my-4 grid gap-3">
        {recipes.map((r) => (
          <div
            key={r.what}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong className="text-slate-900">{r.what}</strong>
              <span className="font-mono text-xs text-slate-500">
                {r.example}
              </span>
            </div>
            <div className="mt-2 rounded-lg bg-slate-950 px-3 py-2 font-mono text-sm text-amber-300">
              Cache-Control: <Directives value={r.header} />
            </div>
            <p className="mt-2 text-sm text-slate-600">{r.why}</p>
          </div>
        ))}
      </div>

      <H2>Choosing a header in four questions</H2>
      <ol className="my-4 space-y-2">
        {[
          [
            'Is it sensitive or personal and must never be kept on disk?',
            'no-store',
          ],
          [
            'Does the URL change whenever the content changes (hash in file name)?',
            'public, max-age=31536000, immutable',
          ],
          [
            'Must users always see the very latest version?',
            'no-cache + ETag (add private if it’s per-user)',
          ],
          [
            'Otherwise: how long can people live with an outdated version?',
            'max-age=<that many seconds> (+ ETag, + private if per-user)',
          ],
        ].map(([q, a], i) => (
          <li
            key={q}
            className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {i + 1}
            </span>
            <div>
              <p className="text-sm text-slate-800">{q}</p>
              <p className="mt-1 font-mono text-sm text-emerald-700">
                Yes → {a}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <H2>Common mistakes</H2>
      <Bullets>
        <li>
          Thinking <C>no-cache</C> means &quot;don&apos;t cache&quot;. It means
          &quot;always revalidate&quot;. Use <C>no-store</C> to not cache.
        </li>
        <li>
          A long <C>max-age</C> on a file whose content changes but whose URL
          stays the same (like <C>/app.js</C>): users get stuck with old code.
        </li>
        <li>
          Forgetting <C>Vary</C> when the response depends on a request header:
          users get the wrong variant.
        </li>
        <li>
          <C>public</C> (or no <C>private</C>) on personal data behind a CDN:
          other users can see it.
        </li>
        <li>
          Testing with DevTools &quot;Disable cache&quot; ticked, and concluding
          that caching doesn&apos;t work.
        </li>
        <li>
          Expecting your JavaScript to see a 304: <C>fetch()</C> turns it into a
          200 with the cached body.
        </li>
      </Bullets>

      <H2>Setting headers in ASP.NET Core</H2>
      <pre className="my-4 overflow-x-auto rounded-lg bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-slate-200">
        {`// Minimal API: set the header yourself
app.MapGet("/api/products", (HttpContext ctx) =>
{
    ctx.Response.Headers.CacheControl = "public, max-age=60";
    return Results.Ok(products);
});

// Controllers: the [ResponseCache] attribute
[ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
public IActionResult Get() => Ok(products);

// Static files: long cache ONLY for fingerprinted files (Vite puts them in /assets).
// Everything else, like index.html, must stay fresh: give it no-cache.
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = c =>
        c.Context.Response.Headers.CacheControl =
            c.Context.Request.Path.StartsWithSegments("/assets")
                ? "public, max-age=31536000, immutable"
                : "no-cache"
});`}
      </pre>
      <P>
        See <C>API/DemoEndpoints.cs</C> in this project for a hand-written ETag
        / Last-Modified check that returns 304.
      </P>
      <Callout kind="tip">
        Don&apos;t confuse these headers with ASP.NET Core&apos;s{' '}
        <em>server-side</em> caching (<C>AddOutputCache</C>, <C>IMemoryCache</C>
        , <C>HybridCache</C>). Those keep data inside your server. Cache headers
        tell <em>browsers and CDNs</em> what they may do.
      </Callout>

      <H2>Glossary</H2>
      <dl className="my-4 grid gap-x-6 gap-y-3 sm:grid-cols-[max-content_1fr]">
        {glossary.map(([term, def]) => (
          <div key={term} className="contents">
            <dt className="font-semibold text-slate-900">{term}</dt>
            <dd className="text-slate-600">{def}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}

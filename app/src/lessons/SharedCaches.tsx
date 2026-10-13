import { Callout } from '#/components/Callout'
import { C, H2, HttpMessage, P } from '#/components/Prose'

const directives: Array<[string, string, string]> = [
  [
    'public',
    'Any cache may store it, including CDNs, even if the request had an Authorization header.',
    'Static assets, public pages',
  ],
  [
    'private',
    'Only the user’s own browser may store it. CDNs and proxies must not.',
    '/api/me, a page with the user’s name in it',
  ],
  [
    's-maxage=N',
    'Like max-age, but only for shared caches. Overrides max-age there. Browsers ignore it.',
    'Browser 1 min, CDN 1 hour',
  ],
  [
    'must-revalidate',
    'Once stale, the copy must be revalidated. Never serve it stale, not even when the server is down.',
    'Prices, stock levels',
  ],
  [
    'proxy-revalidate',
    'Same as must-revalidate, but only for shared caches.',
    'Rarely used',
  ],
  [
    'immutable',
    'This content will never change. Don’t revalidate it, not even on reload.',
    'Fingerprinted files like app.3f9a1c.js',
  ],
  [
    'stale-if-error=N',
    'If the server errors or is unreachable, a stale copy may be used for N more seconds.',
    'Keep a site up during outages',
  ],
  [
    'no-transform',
    'Middle boxes must not modify the body (e.g. recompress images).',
    'Images, signed files',
  ],
]

export function SharedCaches() {
  return (
    <>
      <P>
        Until now we only talked about <strong>your browser&apos;s</strong>{' '}
        cache. But between the browser and the server there are often other
        caches: a company proxy, or more commonly a <strong>CDN</strong>{' '}
        (Cloudflare, Akamai, Azure Front Door, CloudFront…), servers around the
        world that keep copies close to users.
      </P>
      <CacheLayers />
      <P>
        A browser cache is a <strong>private cache</strong>: it belongs to one
        person. A CDN is a <strong>shared cache</strong>: one stored copy is
        handed to many different people. That difference is what the directives
        below are about. You can&apos;t see them in action with a single
        browser, but you need to know them.
      </P>

      <H2>Directives for shared caches and edge cases</H2>
      <div className="my-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-slate-500">
              <th className="py-2 pr-4">Directive</th>
              <th className="py-2 pr-4">Meaning</th>
              <th className="py-2">Example use</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {directives.map(([name, meaning, use]) => (
              <tr key={name} className="border-b border-slate-200 align-top">
                <td className="py-2 pr-4 font-mono font-semibold whitespace-nowrap">
                  {name}
                </td>
                <td className="py-2 pr-4">{meaning}</td>
                <td className="py-2 text-slate-500">{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout
        kind="warn"
        title="The classic disaster: personal data in a shared cache"
      >
        Imagine <C>GET /api/me</C> returns{' '}
        <C>Cache-Control: public, max-age=60</C>. Alice requests it, the CDN
        stores her profile, and for the next 60 seconds{' '}
        <strong>everyone</strong> asking for <C>/api/me</C> gets Alice&apos;s
        data. Anything personal should be <C>private</C> (or <C>no-store</C>).
      </Callout>

      <H2>Some combinations</H2>
      <HttpMessage
        title="Browser keeps it 1 minute, the CDN keeps it 1 hour"
        lines={['Cache-Control: public, max-age=60, s-maxage=3600']}
        highlight={['Cache-Control']}
      />
      <HttpMessage
        title="The user's own data: only their browser, always checked"
        lines={['Cache-Control: private, no-cache', 'ETag: "u42-v7"']}
        highlight={['Cache-Control']}
      />
      <HttpMessage
        title="A fingerprinted file that never changes"
        lines={['Cache-Control: public, max-age=31536000, immutable']}
        highlight={['Cache-Control']}
      />

      <H2>Two more headers you might meet</H2>
      <P>
        <C>Age: 120</C> is added by shared caches: &quot;this copy already sat
        in the CDN for 120 seconds&quot;. The browser subtracts it from{' '}
        <C>max-age</C>, so a <C>max-age=300</C> response with <C>Age: 120</C> is
        fresh for only 180 more seconds.
      </P>
      <P>
        <C>Pragma: no-cache</C> is a deprecated HTTP/1.0 leftover. It only has a
        defined meaning in a <em>request</em> (&quot;please revalidate&quot;);
        in a response it doesn&apos;t officially mean anything. Modern code uses{' '}
        <C>Cache-Control</C>.
      </P>
    </>
  )
}

function CacheLayers() {
  const box =
    'flex flex-1 flex-col items-center rounded-xl border-2 bg-white px-3 py-3 text-center'
  const arrow = 'self-center text-slate-400 rotate-90 md:rotate-0'
  return (
    <div className="my-5 flex flex-col gap-2 md:flex-row">
      <div className={`${box} border-emerald-300`}>
        <span className="text-2xl">🧑‍💻</span>
        <strong className="text-sm">Browser</strong>
        <span className="text-xs text-slate-500">private cache, one user</span>
      </div>
      <span className={arrow}>⇄</span>
      <div className={`${box} border-violet-300`}>
        <span className="text-2xl">🌍</span>
        <strong className="text-sm">CDN / proxy</strong>
        <span className="text-xs text-slate-500">shared cache, many users</span>
      </div>
      <span className={arrow}>⇄</span>
      <div className={`${box} border-slate-300`}>
        <span className="text-2xl">🖥️</span>
        <strong className="text-sm">Origin server</strong>
        <span className="text-xs text-slate-500">the real source</span>
      </div>
    </div>
  )
}

import { Callout } from '#/components/Callout'
import { OutcomeBadge } from '#/components/OutcomeBadge'
import { Bullets, C, H2, HttpMessage, P } from '#/components/Prose'
import { outcomeInfo } from '#/lib/classify'
import type { Outcome } from '#/lib/classify'

export function Intro() {
  return (
    <>
      <P>
        Every time your browser loads something (a web page, an image, a font,
        some JSON from an API) it has to ask a server for it and wait for the
        answer. That takes time and costs data. So browsers can{' '}
        <strong>keep a copy</strong> of what they downloaded and reuse it next
        time. That stash of copies is called the <strong>HTTP cache</strong>.
      </P>
      <P>
        But how does the browser know whether it&apos;s okay to reuse a copy?
        Maybe the content changed in the meantime! It doesn&apos;t guess:{' '}
        <strong>the server tells it</strong>, using a few special lines in the
        response called <strong>cache headers</strong>. This app teaches you
        those headers by letting you watch a real browser cache at work.
      </P>

      <Callout kind="analogy">
        Think of milk in your fridge. When you buy it, it has a{' '}
        <em>best-before date</em>. Until that date you just drink it, no
        questions asked. After the date you don&apos;t necessarily throw it
        away: you sniff it to check whether it&apos;s still good. And some
        things (like fresh sushi) you&apos;re told to never put in the fridge at
        all. HTTP caching works exactly like this:
        <Bullets>
          <li>
            <strong>Best-before date</strong> → <C>Cache-Control: max-age=60</C>{' '}
            (&quot;good for 60 seconds&quot;)
          </li>
          <li>
            <strong>Sniffing it</strong> → asking the server &quot;has this
            changed?&quot; using an <C>ETag</C> or <C>Last-Modified</C>, and
            getting <C>304 Not Modified</C> back if it didn&apos;t
          </li>
          <li>
            <strong>Never put in the fridge</strong> →{' '}
            <C>Cache-Control: no-store</C>
          </li>
        </Bullets>
      </Callout>

      <H2>First: what is a header?</H2>
      <P>
        An HTTP request and response are just text. The first line says
        what&apos;s happening, then come <strong>headers</strong> (
        <C>Name: value</C> lines with extra information), then an empty line,
        then the <strong>body</strong> (the actual content). Here is the browser
        asking for a photo:
      </P>
      <HttpMessage
        title="Request (browser → server)"
        lines={[
          'GET /photo.jpg HTTP/1.1',
          'Host: example.com',
          'Accept: image/*',
        ]}
      />
      <P>
        And here is the server&apos;s answer. The highlighted lines are the
        cache headers this app is all about:
      </P>
      <HttpMessage
        title="Response (server → browser)"
        lines={[
          'HTTP/1.1 200 OK',
          'Content-Type: image/jpeg',
          'Date: Mon, 12 Oct 2026 10:00:00 GMT',
          'Cache-Control: max-age=3600',
          'ETag: "a1b2c3"',
          '',
          '…the bytes of the photo…',
        ]}
        highlight={['Cache-Control', 'ETag']}
      />
      <P>
        Translation: &quot;Here&apos;s the photo. You may reuse it for the next
        3600 seconds (one hour) without asking me. Its version label is{' '}
        <C>&quot;a1b2c3&quot;</C>, so if you want to check later whether it
        changed, mention that label.&quot;
      </P>

      <H2>The three questions a browser asks</H2>
      <P>
        Every time your code asks for something that&apos;s already in the
        cache, the browser goes through roughly this:
      </P>
      <DecisionFlow />

      <H2>How to read this app</H2>
      <P>
        Every lesson has a <strong>live demo</strong>. When you press{' '}
        <em>Send request</em>, the page calls a completely normal <C>fetch()</C>{' '}
        against a small ASP.NET Core server, and the browser&apos;s real HTTP
        cache decides what to do. JavaScript can&apos;t look inside that cache,
        so the server keeps a log of every request that actually reached it.
        Comparing &quot;what JavaScript got&quot; with &quot;what the server
        saw&quot; tells us what the cache did. Each click ends up as one of
        these:
      </P>
      <div className="my-4 grid gap-3 sm:grid-cols-2">
        {(
          [
            'cache',
            'revalidated',
            'downloaded',
            'stale-revalidating',
          ] as Array<Outcome>
        ).map((o) => (
          <div
            key={o}
            className="rounded-xl border border-slate-200 bg-white p-3"
          >
            <OutcomeBadge outcome={o} size="sm" />
            <p className="mt-2 text-sm text-slate-600">
              {outcomeInfo[o].short}
            </p>
          </div>
        ))}
      </div>
      <Bullets>
        <li>
          The <strong>flow diagram</strong> shows how far each request
          travelled: stopped at the browser cache, or went all the way to the
          server.
        </li>
        <li>
          The <strong>freshness bar</strong> is a live countdown of how long the
          cached copy stays fresh.
        </li>
        <li>
          Every response has a <strong>request number</strong> in its body. If
          you see an old number, you&apos;re looking at a copy from the cache.
        </li>
        <li>
          The server waits an extra <strong>~300 ms</strong> before answering
          (pretend it&apos;s far away), so you can feel how fast a cache hit is.
        </li>
        <li>Hover any header or directive to see what it means.</li>
      </Bullets>

      <Callout kind="warn" title="Before you start: DevTools 'Disable cache'">
        If you open your browser&apos;s DevTools (F12), make sure{' '}
        <strong>Network → &quot;Disable cache&quot;</strong> is{' '}
        <strong>unticked</strong>, or nothing will ever come from the cache and
        the demos won&apos;t work. With it unticked, the Network tab is a great
        second opinion: cache hits show as <C>(disk cache)</C> or{' '}
        <C>(memory cache)</C>, and revalidations as status <C>304</C>.
      </Callout>
    </>
  )
}

function DecisionFlow() {
  const step = 'rounded-xl border-2 bg-white px-4 py-3 text-sm'
  const yes = 'mt-1 text-xs text-slate-600'
  return (
    <div className="my-5 grid gap-3">
      <div className={`${step} border-red-200`}>
        <strong>1. May I store it at all?</strong>
        <p className={yes}>
          If the response said <C>no-store</C>: no. Nothing was kept, every
          request downloads everything. →{' '}
          <OutcomeBadge outcome="downloaded" size="sm" />
        </p>
      </div>
      <div className={`${step} border-emerald-200`}>
        <strong>2. Is my copy still fresh?</strong>{' '}
        <span className="text-slate-500">
          (based on <C>max-age</C> or <C>Expires</C>)
        </span>
        <p className={yes}>
          Yes → use it immediately, don&apos;t even talk to the server. →{' '}
          <OutcomeBadge outcome="cache" size="sm" />
        </p>
        <p className={yes}>
          It&apos;s a little stale but <C>stale-while-revalidate</C> allows it →
          use it now, refresh in the background. →{' '}
          <OutcomeBadge outcome="stale-revalidating" size="sm" />
        </p>
      </div>
      <div className={`${step} border-sky-200`}>
        <strong>
          3. It&apos;s stale. Can I cheaply check whether it changed?
        </strong>{' '}
        <span className="text-slate-500">
          (only if it has an <C>ETag</C> or <C>Last-Modified</C>)
        </span>
        <p className={yes}>
          Yes → ask the server &quot;do you still have version X?&quot;.
          Unchanged: <OutcomeBadge outcome="revalidated" size="sm" /> Changed:{' '}
          <OutcomeBadge outcome="downloaded" size="sm" />
        </p>
        <p className={yes}>
          No → download everything again. →{' '}
          <OutcomeBadge outcome="downloaded" size="sm" />
        </p>
      </div>
    </div>
  )
}

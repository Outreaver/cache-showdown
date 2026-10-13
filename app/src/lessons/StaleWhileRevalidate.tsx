import { Callout } from '#/components/Callout'
import { DemoPanel } from '#/components/DemoPanel'
import { Bullets, C, H2, HttpMessage, P } from '#/components/Prose'

export function StaleWhileRevalidate() {
  return (
    <>
      <P>
        So far a stale copy always meant waiting for the server.{' '}
        <C>stale-while-revalidate</C> adds a middle ground:{' '}
        <strong>
          &quot;If the copy is only a little stale, show it right away, and
          fetch a fresh one in the background for next time.&quot;
        </strong>
      </P>
      <HttpMessage
        title="What the server sends"
        lines={[
          'HTTP/1.1 200 OK',
          'Cache-Control: max-age=5, stale-while-revalidate=20',
          '',
          '{ … }',
        ]}
        highlight={['Cache-Control']}
      />
      <P>This splits a copy&apos;s life into three phases:</P>
      <Bullets>
        <li>
          <strong>0–5 s, fresh</strong> (green): used directly, no network.
        </li>
        <li>
          <strong>5–25 s, stale but allowed</strong> (purple): the browser
          answers <em>instantly</em> with the stale copy and, at the same time,
          sends a request in the background. When that finishes, the cache holds
          the new version.
        </li>
        <li>
          <strong>after 25 s, stale</strong> (amber): too old. A normal request,
          and you wait for it.
        </li>
      </Bullets>

      <Callout kind="try">
        <ol>
          <li>
            Send a request. Then wait until the freshness bar is in the{' '}
            <strong>purple</strong> zone (about 6–10 s).
          </li>
          <li>
            Send: it&apos;s instant, shows an old request number, but the server{' '}
            <em>did</em> get a request, in the background.
          </li>
          <li>
            Send again immediately: now you get the new request number, from the
            cache, instantly.
          </li>
          <li>
            Finally, wait more than 25 seconds and send. Back to a normal full
            download.
          </li>
        </ol>
      </Callout>

      <DemoPanel
        scenario="swr"
        headers={['Cache-Control: max-age=5, stale-while-revalidate=20']}
      />

      <Callout kind="notice">
        <ul>
          <li>
            In the purple zone your code got its answer in a few milliseconds,{' '}
            <strong>and</strong> the server log shows a request: the browser
            refreshed the copy behind your back.
          </li>
          <li>
            You saw the old content once, then the next click had the new
            content. That&apos;s the deal: speed now, freshness one request
            later.
          </li>
        </ul>
      </Callout>

      <H2>When to use it</H2>
      <P>
        Great for content where being a few seconds/minutes behind is fine but
        speed matters: avatars, product lists, news feeds, API data that powers
        a dashboard. The React library SWR is named after this directive, and
        libraries like TanStack Query use the same idea, just done in JavaScript
        instead of the HTTP cache.
      </P>
      <Callout kind="warn" title="Browser support">
        Chrome, Edge and Firefox support <C>stale-while-revalidate</C> in their
        HTTP cache. If your browser doesn&apos;t, you&apos;ll just see a normal
        full download once the copy goes stale. That&apos;s the nice thing about
        cache directives: unknown ones are ignored, so things degrade
        gracefully.
      </Callout>
    </>
  )
}

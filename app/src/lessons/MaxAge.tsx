import { Callout } from '#/components/Callout'
import { DemoPanel } from '#/components/DemoPanel'
import { Bullets, C, H2, HttpMessage, P } from '#/components/Prose'

export function MaxAge() {
  return (
    <>
      <P>
        <C>Cache-Control</C> is the main caching header. Its value is a list of
        rules called <strong>directives</strong>. The most important one is{' '}
        <C>max-age</C>:
      </P>
      <HttpMessage
        title="What the server sends"
        lines={['HTTP/1.1 200 OK', 'Cache-Control: max-age=10', '', '{ … }']}
        highlight={['Cache-Control']}
      />
      <P>
        It means:{' '}
        <strong>
          &quot;This answer is good for 10 seconds. Until then, reuse it and
          don&apos;t even ask me.&quot;
        </strong>{' '}
        The number is always in seconds, counted from when the server produced
        the response.
      </P>
      <P>Two words you&apos;ll see everywhere:</P>
      <Bullets>
        <li>
          <strong>Fresh</strong>: the copy is younger than its <C>max-age</C>.
          The browser uses it straight away.
        </li>
        <li>
          <strong>Stale</strong>: the copy is older than its <C>max-age</C>. The
          browser must not use it without talking to the server first.
        </li>
      </Bullets>

      <Callout kind="try">
        <ol>
          <li>
            Press <strong>Send request</strong> once. The first request always
            goes to the server (the cache is empty).
          </li>
          <li>
            Quickly press it several more times while the freshness bar is
            green.
          </li>
          <li>Wait until the bar turns amber (stale), then press it again.</li>
          <li>
            Bonus: press <strong>Change resource on server</strong> while the
            copy is fresh, then send again. Which version do you get?
          </li>
        </ol>
      </Callout>

      <DemoPanel
        scenario="max-age"
        headers={['Cache-Control: max-age=10']}
        showChangeResource
      />

      <Callout kind="notice">
        <ul>
          <li>
            While fresh, clicks are <strong>⚡ From browser cache</strong>: they
            take ~1–5 ms instead of ~300 ms, and the request number doesn&apos;t
            change. You&apos;re getting the same old body again.
          </li>
          <li>
            <strong>&quot;What reached the server: Nothing.&quot;</strong> The
            server literally doesn&apos;t know you clicked. In DevTools these
            show as <C>(disk cache)</C> or <C>(memory cache)</C>.
          </li>
          <li>
            After 10 seconds the copy is stale and the next click is a{' '}
            <strong>full download</strong> again. The server didn&apos;t give
            the browser any way to check cheaply (no <C>ETag</C>), so it has to
            fetch the whole thing. That&apos;s the next lessons&apos; topic.
          </li>
          <li>
            If you changed the resource while the copy was fresh, you still got
            the <strong>old version</strong> until it went stale.
          </li>
        </ul>
      </Callout>

      <H2>The trade-off</H2>
      <P>
        <C>max-age</C> is the fastest kind of caching there is: no network at
        all. The price is that once a browser has the copy, you can&apos;t take
        it back. If you send <C>max-age=86400</C> (one day) and then fix a typo,
        some users will see the typo for up to a day. Pick the number based on{' '}
        <em>&quot;how long can people live with an outdated version?&quot;</em>
      </P>
      <Callout kind="tip">
        Common values: <C>max-age=60</C> (a minute) for things that change
        sometimes, <C>max-age=31536000</C> (a year) for files whose URL changes
        whenever their content changes, like <C>app.3f9a1c.js</C>. Changing the
        URL is how you get around &quot;you can&apos;t take it back&quot;: a new
        URL is a new cache entry. This app does the same trick:{' '}
        <strong>Reset</strong> just picks a new <C>?session=</C> value.
      </Callout>
    </>
  )
}

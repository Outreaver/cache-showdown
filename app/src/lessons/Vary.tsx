import { Callout } from '#/components/Callout'
import { DemoPanel } from '#/components/DemoPanel'
import { Bullets, C, H2, HttpMessage, P } from '#/components/Prose'

export function Vary() {
  return (
    <>
      <P>
        How does a cache find a stored copy? By default it looks it up by the{' '}
        <strong>URL</strong> (and method, like GET). That&apos;s called the{' '}
        <strong>cache key</strong>.
      </P>
      <P>
        But sometimes the same URL returns different content depending on a{' '}
        <em>request</em> header. Our demo server greets you in the language from{' '}
        <C>Accept-Language</C>: English, Polish or German, all at the same URL.
        If the cache only looked at the URL, it could hand a German speaker the
        Polish copy.
      </P>
      <P>
        The <C>Vary</C> header fixes that. It tells caches:{' '}
        <strong>
          &quot;The answer depends on these request headers too. Only reuse a
          copy if they match.&quot;
        </strong>
      </P>
      <HttpMessage
        title="What the server sends"
        lines={[
          'HTTP/1.1 200 OK',
          'Cache-Control: max-age=30',
          'Vary: Accept-Language',
          '',
          '{ "message": "Cześć!" }',
        ]}
        highlight={['Vary']}
      />

      <H2>First, the bug: Vary is missing</H2>
      <Callout kind="try">
        <ol>
          <li>Leave the language on English and press Send.</li>
          <li>
            Switch to <strong>Polski</strong> and press Send again (within 30
            seconds).
          </li>
        </ol>
        What greeting do you get? Does it match the language you asked for?
      </Callout>

      <DemoPanel
        scenario="vary-missing"
        title="Live demo: without Vary (buggy)"
        headers={['Cache-Control: max-age=30', '(no Vary header!)']}
        showLanguage
      />

      <Callout kind="notice">
        You asked for Polish and got <strong>&quot;Hello!&quot;</strong>, from
        the cache, and the server never even saw the Polish request. The cache
        matched only the URL. This is a real bug that happens in production,
        often with CDNs.
      </Callout>

      <H2>Now with Vary</H2>
      <Callout kind="try">
        Same steps: English, Send, Send (cache hit). Then switch to Polski and
        Send. Then switch back to English and Send.
      </Callout>

      <DemoPanel
        scenario="vary"
        title="Live demo: with Vary: Accept-Language"
        headers={['Cache-Control: max-age=30', 'Vary: Accept-Language']}
        showLanguage
      />

      <Callout kind="notice">
        <ul>
          <li>
            Repeating the same language gives ⚡ cache hits, just like before.
          </li>
          <li>
            Switching to Polski goes to the server and you get{' '}
            <strong>&quot;Cześć!&quot;</strong>. Correct!
          </li>
          <li>
            Switching back to English may go to the server again too. Most
            browsers keep only <strong>one</strong> copy per URL, so the Polish
            copy replaced the English one. CDNs usually keep one copy per
            variant. Either way, you never get the wrong language.
          </li>
        </ul>
      </Callout>

      <H2>In real life</H2>
      <Bullets>
        <li>
          <C>Vary: Accept-Encoding</C> is the most common one: the same file
          compressed with gzip vs brotli vs not at all. Servers add it
          automatically when they compress.
        </li>
        <li>
          <C>Vary: Cookie</C> or <C>Vary: Authorization</C> is legal but makes
          copies almost never reusable in shared caches, since every user has
          different values.
        </li>
        <li>
          <C>Vary: *</C> means &quot;depends on things you can&apos;t see&quot;,
          so effectively never reuse it without revalidating.
        </li>
      </Bullets>
    </>
  )
}

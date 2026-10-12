import { Callout } from '#/components/Callout'
import { DemoPanel } from '#/components/DemoPanel'
import { C, H2, HttpMessage, P } from '#/components/Prose'

export function NoCache() {
  return (
    <>
      <P>
        This is the most misleadingly named thing in HTTP.{' '}
        <C>Cache-Control: no-cache</C> does <strong>not</strong> mean
        &quot;don&apos;t cache&quot;. It means:
      </P>
      <P>
        <strong>
          &quot;You may store this, but you must check with me before every
          single use.&quot;
        </strong>
      </P>
      <HttpMessage
        title="What the server sends"
        lines={[
          'HTTP/1.1 200 OK',
          'Cache-Control: no-cache',
          'ETag: "v1"',
          '',
          '{ … }',
        ]}
        highlight={['Cache-Control']}
      />
      <P>
        In other words, the copy is stale from the very first second, so every
        use becomes a revalidation. With an <C>ETag</C> (or <C>Last-Modified</C>
        ) most of those checks end with a cheap <C>304</C>.
      </P>

      <Callout kind="try">
        <ol>
          <li>Send a few requests. Can you ever get a ⚡ cache hit?</li>
          <li>
            Change the resource on the server and send again. How quickly do you
            see version 2?
          </li>
        </ol>
      </Callout>

      <DemoPanel
        scenario="no-cache"
        headers={['Cache-Control: no-cache', 'ETag: "v<version>"']}
        showChangeResource
      />

      <Callout kind="notice">
        <ul>
          <li>
            The first request is a full download. After that, every click is a{' '}
            <strong>304</strong>: the copy is stored and reused.
          </li>
          <li>
            Every click still reaches the server, so you never get the ~1 ms
            cache-hit speed.
          </li>
          <li>
            After changing the resource you get version 2{' '}
            <strong>immediately</strong>. You&apos;re never shown outdated
            content.
          </li>
        </ul>
      </Callout>

      <H2>When to use it</H2>
      <P>
        When content <strong>must always be up to date</strong>, but you still
        want to avoid re-downloading it when it hasn&apos;t changed. The classic
        example is a website&apos;s <C>index.html</C>: it must always point to
        the latest JS/CSS files, but it rarely changes between visits.
      </P>
      <Callout kind="tip">
        <C>no-cache</C> behaves almost the same as{' '}
        <C>max-age=0, must-revalidate</C>. Pressing the browser&apos;s normal
        reload button (F5) does something similar for the page you&apos;re on:
        it revalidates instead of trusting the cache.
      </Callout>
    </>
  )
}

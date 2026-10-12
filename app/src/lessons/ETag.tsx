import { Callout } from '#/components/Callout'
import { DemoPanel } from '#/components/DemoPanel'
import { C, H2, HttpMessage, P } from '#/components/Prose'

export function ETag() {
  return (
    <>
      <P>
        In the <C>max-age</C> lesson, once the copy went stale the browser had
        to download the whole thing again, even if nothing had changed. What a
        waste! It would be much better to ask:{' '}
        <em>&quot;I have this version. Is it still current?&quot;</em>{' '}
        That&apos;s called <strong>revalidation</strong>, and an <C>ETag</C>{' '}
        makes it possible.
      </P>
      <P>
        An <C>ETag</C> (&quot;entity tag&quot;) is a{' '}
        <strong>version label</strong> for the content. It can be anything in
        quotes: a version number like <C>&quot;v1&quot;</C>, or (most commonly)
        a hash of the content like <C>&quot;33a64df5&quot;</C>. If the content
        changes, the ETag changes.
      </P>

      <H2>The conversation</H2>
      <HttpMessage
        title="1. First request: the server sends the content and its label"
        lines={[
          'HTTP/1.1 200 OK',
          'Cache-Control: max-age=5',
          'ETag: "v1"',
          '',
          '{ …the whole body… }',
        ]}
        highlight={['ETag']}
      />
      <P>
        For 5 seconds the copy is fresh and used directly. After that it&apos;s
        stale, so on the next request the browser adds:
      </P>
      <HttpMessage
        title="2. Later: the browser asks “send it only if it's not v1 any more”"
        lines={['GET /api/demo/etag HTTP/1.1', 'If-None-Match: "v1"']}
        highlight={['If-None-Match']}
      />
      <HttpMessage
        title="3a. Nothing changed: a tiny answer with no body"
        lines={[
          'HTTP/1.1 304 Not Modified',
          'Cache-Control: max-age=5',
          'ETag: "v1"',
          '',
          '(no body)',
        ]}
      />
      <HttpMessage
        title="3b. Something changed: the full new body and the new label"
        lines={[
          'HTTP/1.1 200 OK',
          'Cache-Control: max-age=5',
          'ETag: "v2"',
          '',
          '{ …the new body… }',
        ]}
        highlight={['ETag']}
      />
      <P>
        A <C>304</C> also <strong>refreshes</strong> the cached copy: it&apos;s
        fresh again for another <C>max-age</C> seconds.
      </P>

      <Callout kind="try">
        <ol>
          <li>
            Press <strong>Send request</strong> (full download, ETag{' '}
            <C>&quot;v1&quot;</C>).
          </li>
          <li>Press it again while fresh (⚡ from cache).</li>
          <li>
            Wait for the bar to go amber, then send again. Look at what reached
            the server: an <C>If-None-Match</C> header you never wrote!
          </li>
          <li>
            Press <strong>Change resource on server</strong> (now it&apos;s v2),
            wait until stale, and send again.
          </li>
        </ol>
      </Callout>

      <DemoPanel
        scenario="etag"
        headers={['Cache-Control: max-age=5', 'ETag: "v<version>"']}
        showChangeResource
      />

      <Callout kind="notice">
        <ul>
          <li>
            When stale, the browser <strong>automatically</strong> added{' '}
            <C>If-None-Match: &quot;v1&quot;</C>. You never write this yourself.
          </li>
          <li>
            The server replied <strong>304</strong>, and your JavaScript still
            got a normal <C>200</C> with the old body (old request number). The
            browser hides the 304 from <C>fetch()</C>. Only DevTools and the
            server log show it.
          </li>
          <li>
            After a 304, the freshness bar starts over: the copy is fresh again.
          </li>
          <li>
            After changing the resource, the ETag didn&apos;t match any more, so
            the server sent a full 200 with <C>&quot;v2&quot;</C>.
          </li>
        </ul>
      </Callout>

      <H2>What does a 304 actually save?</H2>
      <P>
        A 304 still needs a trip to the server (~300 ms here), so it&apos;s not
        as fast as a fresh cache hit. What it saves is the <strong>body</strong>
        : imagine a 2 MB image or a big JSON list. Instead of 2 MB you transfer
        a few hundred bytes of headers. The server may also save work if it can
        compute the ETag cheaply.
      </P>
      <Callout kind="tip" title="Strong vs weak ETags">
        <C>&quot;v1&quot;</C> is a <em>strong</em> ETag: byte-for-byte
        identical. <C>W/&quot;v1&quot;</C> is a <em>weak</em> one:
        &quot;equivalent enough&quot; (e.g. the same page with a different
        timestamp in the footer). For caching you can treat them the same.
      </Callout>
      <Callout kind="tip" title="In ASP.NET Core">
        This demo checks <C>If-None-Match</C> by hand in{' '}
        <C>API/DemoEndpoints.cs</C> so you can read the logic. For static files,
        ASP.NET Core&apos;s <C>UseStaticFiles()</C> sends ETags and handles 304s
        for you.
      </Callout>
    </>
  )
}

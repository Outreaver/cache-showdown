import { Callout } from '#/components/Callout'
import { DemoPanel } from '#/components/DemoPanel'
import { Bullets, C, H2, HttpMessage, P } from '#/components/Prose'

export function LastModified() {
  return (
    <>
      <P>
        <C>Last-Modified</C> is the older sibling of <C>ETag</C>. Instead of a
        version label, the server says <strong>when</strong> the content last
        changed. Later the browser asks &quot;has it changed since that
        date?&quot;
      </P>
      <HttpMessage
        title="1. First response"
        lines={[
          'HTTP/1.1 200 OK',
          'Cache-Control: max-age=5',
          'Last-Modified: Mon, 12 Oct 2026 10:00:00 GMT',
          '',
          '{ … }',
        ]}
        highlight={['Last-Modified']}
      />
      <HttpMessage
        title="2. When stale, the browser asks"
        lines={[
          'GET /api/demo/last-modified HTTP/1.1',
          'If-Modified-Since: Mon, 12 Oct 2026 10:00:00 GMT',
        ]}
        highlight={['If-Modified-Since']}
      />
      <P>
        Exactly like before, the server answers <C>304 Not Modified</C> if
        nothing changed since then, or <C>200</C> with the new body and a new{' '}
        <C>Last-Modified</C> date.
      </P>

      <Callout kind="try">
        Same steps as the ETag lesson: send, send again while fresh, wait until
        stale and send (look for <C>If-Modified-Since</C>), then change the
        resource and send once more after it goes stale.
      </Callout>

      <DemoPanel
        scenario="last-modified"
        headers={[
          'Cache-Control: max-age=5',
          'Last-Modified: <when the resource last changed>',
        ]}
        showChangeResource
      />

      <Callout kind="notice">
        The flow is the same as with ETags: stale copy → conditional request →
        304 (reuse) or 200 (new content). Only the header names differ:{' '}
        <C>Last-Modified</C>/<C>If-Modified-Since</C> instead of <C>ETag</C>/
        <C>If-None-Match</C>.
      </Callout>

      <H2>Why ETag is usually preferred</H2>
      <Bullets>
        <li>
          <strong>One-second precision.</strong> HTTP dates have no
          milliseconds. Two changes within the same second look identical, so a
          browser could keep the older one.
        </li>
        <li>
          <strong>Dates aren&apos;t the same as content.</strong> If a file is
          re-deployed without changes, its date changes and everyone downloads
          it again. If a change is reverted, the date says &quot;changed&quot;
          even though the content is back to what they had.
        </li>
        <li>
          <strong>Multiple servers</strong> behind a load balancer might report
          different modification times for the same file.
        </li>
      </Bullets>
      <P>
        Servers often send <strong>both</strong>. The browser then sends both{' '}
        <C>If-None-Match</C> and <C>If-Modified-Since</C>, and the rules say the
        server must use <C>If-None-Match</C> and ignore the date.
      </P>
    </>
  )
}

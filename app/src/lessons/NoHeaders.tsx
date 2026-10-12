import { Callout } from '#/components/Callout'
import { DemoPanel } from '#/components/DemoPanel'
import { C, H2, HttpMessage, P } from '#/components/Prose'

export function NoHeaders() {
  return (
    <>
      <P>
        Let&apos;s start with the baseline: a server that says{' '}
        <strong>nothing at all</strong> about caching. No <C>Cache-Control</C>,
        no <C>Expires</C>, no <C>ETag</C>, no <C>Last-Modified</C>.
      </P>
      <HttpMessage
        title="What the server sends"
        lines={[
          'HTTP/1.1 200 OK',
          'Content-Type: application/json',
          'Date: Mon, 12 Oct 2026 10:00:00 GMT',
          '',
          '{ "requestNumber": 1, … }',
        ]}
      />
      <P>
        The browser has no idea how long this answer stays correct, and no way
        to cheaply check whether it changed later. So the safe choice is to ask
        the server again, every single time.
      </P>

      <Callout kind="try">
        <ol>
          <li>
            Press <strong>Send request</strong> three or four times.
          </li>
          <li>
            Look at the badge, the time in milliseconds, and the request number
            of each click.
          </li>
        </ol>
      </Callout>

      <DemoPanel
        scenario="no-headers"
        headers={['(no caching headers at all)']}
      />

      <Callout kind="notice">
        <ul>
          <li>
            Every click is a <strong>200 Full download</strong> and takes ~300
            ms.
          </li>
          <li>
            The request number goes up each time: #1, #2, #3… The server did all
            the work again for every click.
          </li>
          <li>
            &quot;What reached the server&quot; is never empty, and the browser
            sends no special headers like <C>If-None-Match</C>.
          </li>
        </ul>
      </Callout>

      <H2>Is that bad?</H2>
      <P>
        Not always! For data that changes all the time it&apos;s exactly what
        you want. But for things that rarely change (a logo, a CSS file, a list
        of countries) it&apos;s wasted time and bandwidth. The next lessons show
        how to do better.
      </P>
      <Callout kind="tip" title="Small print: heuristic caching">
        If a response has no freshness information but <em>does</em> have a{' '}
        <C>Last-Modified</C> date, browsers are allowed to{' '}
        <strong>guess</strong> a lifetime (typically 10% of the time since it
        was last modified). That&apos;s why it&apos;s good practice to always
        send an explicit <C>Cache-Control</C>, so nobody has to guess. You can
        see the guess in action in the Playground: turn on Last-Modified with an
        empty Cache-Control.
      </Callout>
    </>
  )
}

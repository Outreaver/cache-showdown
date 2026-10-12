import { Callout } from '#/components/Callout'
import { DemoPanel } from '#/components/DemoPanel'
import { C, H2, HttpMessage, P } from '#/components/Prose'

export function Expires() {
  return (
    <>
      <P>
        Before <C>Cache-Control</C> existed (HTTP/1.0, the 1990s), there was{' '}
        <C>Expires</C>. Instead of &quot;fresh for N seconds&quot; it gives an
        exact <strong>date and time</strong> when the copy goes stale:
      </P>
      <HttpMessage
        title="What the server sends"
        lines={[
          'HTTP/1.1 200 OK',
          'Date: Mon, 12 Oct 2026 10:00:00 GMT',
          'Expires: Mon, 12 Oct 2026 10:00:10 GMT',
          '',
          '{ … }',
        ]}
        highlight={['Expires']}
      />
      <P>
        Here that&apos;s 10 seconds after the response&apos;s <C>Date</C>, so it
        behaves just like <C>max-age=10</C>.
      </P>

      <Callout kind="try">
        Send a request, click a few more times while it&apos;s fresh, then wait
        for it to go stale. It should feel exactly like the previous lesson.
      </Callout>

      <DemoPanel
        scenario="expires"
        title="Live demo: Expires only"
        headers={['Expires: <now + 10 seconds>']}
      />

      <H2>Why max-age replaced it</H2>
      <P>
        A date depends on clocks. If the server&apos;s clock or the user&apos;s
        clock is wrong, an <C>Expires</C> date can be already in the past (never
        cached) or far in the future (cached way too long). <C>max-age</C> is a
        duration, which avoids that problem. Also, an invalid <C>Expires</C>{' '}
        value (like <C>0</C>) simply means &quot;already expired&quot;.
      </P>
      <P>
        <strong>
          When both are present, <C>max-age</C> wins
        </strong>{' '}
        and <C>Expires</C> is ignored. Servers often still send both so very old
        caches understand something. Let&apos;s prove the rule:
      </P>

      <Callout kind="try">
        This server says <C>Expires</C> in <strong>60 seconds</strong>, but{' '}
        <C>max-age=5</C>. Send a request and watch the freshness bar: does it go
        stale after 5 or after 60 seconds? Send again after ~6 seconds to
        confirm.
      </Callout>

      <DemoPanel
        scenario="expires-and-max-age"
        title="Live demo: Expires and max-age together"
        headers={['Cache-Control: max-age=5', 'Expires: <now + 60 seconds>']}
      />

      <Callout kind="notice">
        After about 5 seconds the next click goes to the server again, even
        though <C>Expires</C> said 60. <C>max-age</C> took priority. Use{' '}
        <C>Cache-Control: max-age</C> in new code; you only need to recognise{' '}
        <C>Expires</C> when you see it.
      </Callout>
    </>
  )
}

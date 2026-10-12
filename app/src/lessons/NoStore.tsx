import { Callout } from '#/components/Callout'
import { DemoPanel } from '#/components/DemoPanel'
import { C, H2, HttpMessage, P } from '#/components/Prose'

export function NoStore() {
  return (
    <>
      <P>
        <C>Cache-Control: no-store</C> is what most people <em>think</em>{' '}
        <C>no-cache</C> means:{' '}
        <strong>
          &quot;Don&apos;t keep this anywhere. Not on disk, not in memory, not
          in a proxy.&quot;
        </strong>
      </P>
      <HttpMessage
        title="What the server sends"
        lines={[
          'HTTP/1.1 200 OK',
          'Cache-Control: no-store',
          'ETag: "v1"',
          '',
          '{ … }',
        ]}
        highlight={['Cache-Control']}
      />
      <P>
        Notice that this server also sends an <C>ETag</C>. Will the browser use
        it to revalidate? Let&apos;s find out, and compare with <C>no-cache</C>{' '}
        right below it.
      </P>

      <Callout kind="try">
        Click Send a few times in both demos and compare what reached the
        server.
      </Callout>

      <DemoPanel
        scenario="no-store"
        title="Live demo: no-store"
        headers={['Cache-Control: no-store', 'ETag: "v<version>"']}
      />
      <DemoPanel
        scenario="no-cache"
        title="For comparison: no-cache"
        headers={['Cache-Control: no-cache', 'ETag: "v<version>"']}
      />

      <Callout kind="notice">
        <ul>
          <li>
            With <C>no-store</C>, every click is a{' '}
            <strong>full 200 download</strong>, and the browser never sends{' '}
            <C>If-None-Match</C>. It can&apos;t: it threw the copy (and its
            ETag) away immediately.
          </li>
          <li>
            With <C>no-cache</C>, the browser keeps the copy and asks each time,
            so you get <strong>304s</strong>.
          </li>
        </ul>
      </Callout>

      <H2>no-cache vs no-store</H2>
      <div className="my-4 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-slate-500">
              <th className="py-2 pr-4" />
              <th className="py-2 pr-4 font-mono">no-cache</th>
              <th className="py-2 font-mono">no-store</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {[
              ['Stored in the cache?', 'Yes', 'No, never'],
              [
                'Asks the server every time?',
                'Yes (revalidates)',
                'Yes (downloads everything)',
              ],
              [
                'Typical answer after the first time',
                '304, tiny',
                '200, full body',
              ],
              ['Can a user see outdated content?', 'No', 'No'],
              [
                'Use it for',
                'Pages that must be current: index.html, frequently changing data',
                'Sensitive data: bank balances, medical info, one-time tokens',
              ],
            ].map(([q, a, b]) => (
              <tr key={q} className="border-b border-slate-200 align-top">
                <td className="py-2 pr-4 font-medium">{q}</td>
                <td className="py-2 pr-4">{a}</td>
                <td className="py-2">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout kind="warn">
        <C>no-store</C> is the right choice for private data on shared
        computers: nothing ends up on disk for the next person to find. But
        don&apos;t use it &quot;just to be safe&quot; everywhere. It throws away
        all the speed benefits, even the cheap 304s.
      </Callout>
    </>
  )
}

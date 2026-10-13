import { Callout } from '#/components/Callout'
import { DemoPanel } from '#/components/DemoPanel'
import { Bullets, C, CodeBlock, H2, HttpMessage, P } from '#/components/Prose'
import noCacheETag from './snippets/NoCacheETag.cs?highlight'

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

      <H2>What does &quot;checking&quot; look like?</H2>
      <P>
        The check is a normal request with one extra header, called a{' '}
        <strong>conditional request</strong>. The browser tells the server which
        version it already has:
      </P>
      <HttpMessage
        title="The browser checks"
        lines={['GET /api/demo/no-cache HTTP/1.1', 'If-None-Match: "v1"']}
        highlight={['If-None-Match']}
      />
      <P>
        The server compares that label with its current version and gives one of
        two answers:
      </P>
      <div className="my-4 grid gap-4 sm:grid-cols-2">
        <HttpMessage
          title="Nothing changed: no body"
          lines={['HTTP/1.1 304 Not Modified', 'ETag: "v1"']}
        />
        <HttpMessage
          title="It changed: the full new body"
          lines={['HTTP/1.1 200 OK', 'ETag: "v2"', '', '{ … version 2 … }']}
        />
      </div>
      <P>
        So the data is <strong>not</strong> sent every time. A <C>304</C> means
        &quot;your copy is fine, use it&quot;, and the browser takes the body
        from its own cache. The check always costs a trip to the server, but a
        download only happens when something actually changed.
      </P>
      <Callout kind="analogy">
        You keep a printed train timetable at home. Before every trip you call
        the station: &quot;Is the timetable dated March 1 still valid?&quot; If
        they say yes, the call took two seconds and you use the paper you
        already have. If they say no, they send you the new one. You never
        travel with an outdated timetable, and you rarely fetch a new one.
      </Callout>

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
      <P>
        In this demo a <C>304</C> takes about as long as a full download: the
        response is tiny, and the server adds the same fake delay to every
        request. The saving shows up with big responses. If the body is 2 MB, a{' '}
        <C>304</C> of a few hundred bytes skips almost the whole transfer.
      </P>

      <H2>What if there is no ETag?</H2>
      <P>
        <C>no-cache</C> only pays off when the response also carries a{' '}
        <strong>validator</strong>: a small label the browser can use to ask
        &quot;is my copy still current?&quot;. That&apos;s either an <C>ETag</C>{' '}
        (a version label) or <C>Last-Modified</C> (the time it last changed).
        Either one works.
      </P>
      <P>
        Without one, the browser still stores the response, but it has nothing
        to check with. It can&apos;t send <C>If-None-Match</C> or{' '}
        <C>If-Modified-Since</C>, so it sends a plain request and the server can
        only answer with a full <C>200</C>. In practice that&apos;s no better
        than not caching at all. Try it in the Playground: set{' '}
        <C>Cache-Control: no-cache</C>, turn ETag and Last-Modified off, and
        every click is a full download.
      </P>

      <H2>Who does the check? (ASP.NET Core)</H2>
      <P>
        The <strong>browser</strong> side is fully automatic. It stores the
        response, adds <C>If-None-Match</C> to the next request, and reuses its
        copy after a <C>304</C>. Your JavaScript does nothing, and{' '}
        <C>fetch()</C> never even sees the 304. On the <strong>server</strong>,
        it depends on what you return:
      </P>
      <Bullets>
        <li>
          <strong>Static files</strong> (<C>UseStaticFiles</C>,{' '}
          <C>MapStaticAssets</C>): handled for you. ASP.NET Core sends{' '}
          <C>ETag</C> and <C>Last-Modified</C> and answers <C>304</C> itself.
        </li>
        <li>
          <strong>
            <C>Results.File(…, lastModified: …, entityTag: …)</C>
          </strong>
          : handled for you, as long as you pass those arguments.
        </li>
        <li>
          <strong>Your own JSON endpoints</strong> (<C>Results.Ok(obj)</C>,
          controllers): <strong>up to you</strong>. ASP.NET Core adds no ETag to
          these and never returns 304 on its own.
        </li>
      </Bullets>
      <P>For a JSON endpoint, the check looks like this:</P>
      <CodeBlock title="Program.cs" html={noCacheETag} />
      <P>
        Step 1 is the important design choice. Reading a version number (or an{' '}
        <C>UpdatedAt</C> date) is cheap, so when nothing changed you skip
        loading, serializing <em>and</em> sending the data. The other option is
        to hash the finished JSON and use the hash as the ETag. That needs no
        database change, but you still build the whole response every time and
        only save the transfer.
      </P>
      <P>
        <C>Last-Modified</C> works the same way, except you compare dates: if
        the data hasn&apos;t changed since the browser&apos;s{' '}
        <C>If-Modified-Since</C>, return <C>304</C>. When a request has both
        headers, <C>If-None-Match</C> wins. This project&apos;s own API does
        exactly this check by hand in <C>EvaluateConditionals</C> in{' '}
        <C>API/DemoEndpoints.cs</C>.
      </P>

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

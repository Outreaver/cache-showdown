/** One-line explanations shown as tooltips wherever a header or directive appears. */
export const headerDocs: Record<string, string> = {
  'cache-control':
    'The main caching header. A comma-separated list of "directives" (rules) for caches.',
  expires:
    'Old (HTTP/1.0) way to say "fresh until this date". Ignored when Cache-Control has max-age.',
  etag: 'A version label / fingerprint of the content. Used later to ask "is my copy still current?".',
  'last-modified':
    'When the content last changed. Used later to ask "has it changed since then?".',
  vary: 'Lists request headers that change the response. Caches must match them too, not just the URL.',
  date: 'When the server produced this response. Freshness is counted from here.',
  age: 'How many seconds this response already spent in a shared cache (e.g. a CDN).',
  'if-none-match':
    'Sent by the browser: "I have the version with this ETag. Only send a body if yours is different."',
  'if-modified-since':
    'Sent by the browser: "I have a copy from this date. Only send a body if it changed since."',
  pragma:
    'Deprecated HTTP/1.0 header. In a request, `Pragma: no-cache` is the old way to ask caches to revalidate. In a response it has no defined meaning.',
  'accept-language': 'Sent by the browser: which languages the user prefers.',
}

export const directiveDocs: Record<string, string> = {
  'max-age':
    'Fresh for this many seconds. While fresh, the browser reuses its copy without asking the server.',
  'no-cache':
    'You MAY store it, but you MUST ask the server (revalidate) before every use. Not "don’t cache"!',
  'no-store':
    'Do not store this anywhere, ever. Every request goes to the server and downloads everything.',
  'stale-while-revalidate':
    'After max-age runs out, for this many extra seconds: answer instantly with the stale copy and refresh it in the background.',
  'stale-if-error':
    'If the server is down or errors, a stale copy may be used for this many seconds.',
  'must-revalidate':
    'Once stale, never use the copy without checking with the server first (no "it’s probably fine").',
  'proxy-revalidate':
    'Like must-revalidate, but only for shared caches (CDNs, proxies).',
  public:
    'Any cache may store this, including shared ones like CDNs, even for requests with Authorization.',
  private:
    'Only the user’s own browser may store this. CDNs and proxies must not.',
  's-maxage':
    'Like max-age, but only for shared caches (CDNs, proxies). Browsers ignore it.',
  immutable:
    'This will never change. Don’t revalidate it, not even when the user presses reload.',
  'no-transform': 'Proxies must not modify the body (e.g. recompress images).',
  'only-if-cached':
    '(Request directive) Only answer from cache; don’t contact the server.',
}

export const cacheHeaderNames = [
  'cache-control',
  'expires',
  'etag',
  'last-modified',
  'vary',
  'age',
  'date',
]

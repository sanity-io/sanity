import {isPlainObject} from '../../util/isPlainObject'
import {type ParsedQueryUrl, parseQueryUrl} from '../../util/parseQueryUrl'
import {splitQuerySearchParams} from '../../util/queryRequestMethod'
import {splitShellWords} from './shellWords'

export interface ParsedQueryPaste extends ParsedQueryUrl {
  /** What was pasted: the query URL itself, or a curl command sending it */
  source: 'url' | 'curl'
}

/**
 * curl options that take a value, so the value is not taken for the URL or for data. Covers what
 * a browser's "Copy as cURL" writes and the common hand-written ones; an unknown option is read as
 * a flag, and its value, if it had one, is then only a word that is not the URL.
 */
const VALUED_OPTIONS = new Set([
  '--abstract-unix-socket',
  '--aws-sigv4',
  '--cacert',
  '--capath',
  '--ciphers',
  '--connect-timeout',
  '--data-urlencode',
  '--dns-servers',
  '--etag-compare',
  '--etag-save',
  '--form-string',
  '--interface',
  '--limit-rate',
  '--max-redirs',
  '--oauth2-bearer',
  '--output-dir',
  '--proto',
  '--resolve',
  '--retry',
  '--retry-delay',
  '--retry-max-time',
  '--stderr',
  '--trace',
  '--trace-ascii',
  '--unix-socket',
  '--url',
  '--url-query',
  '--variable',
  '-A',
  '--user-agent',
  '-b',
  '--cookie',
  '-c',
  '--cookie-jar',
  '-D',
  '--dump-header',
  '-E',
  '--cert',
  '-e',
  '--referer',
  '-F',
  '--form',
  '-H',
  '--header',
  '-K',
  '--config',
  '--key',
  '-m',
  '--max-time',
  '-o',
  '--output',
  '-r',
  '--range',
  '-T',
  '--upload-file',
  '-U',
  '--proxy-user',
  '-u',
  '--user',
  '-w',
  '--write-out',
  '-X',
  '--request',
  '-x',
  '--proxy',
  '-Y',
  '--speed-limit',
  '-y',
  '--speed-time',
  '-z',
  '--time-cond',
])

/** The options that send a request body; curl joins several of them with `&` */
const DATA_OPTIONS = new Set([
  '-d',
  '--data',
  '--data-raw',
  '--data-binary',
  '--data-ascii',
  '--json',
])

for (const option of DATA_OPTIONS) VALUED_OPTIONS.add(option)

const HTTP_URL = /^https?:\/\//i

interface CurlRequest {
  url: string
  /** The request body, when the command sends one */
  data: string | undefined
}

/**
 * The URL and body of a curl command: `curl`, options, and the URL as the first word that is
 * one (or `--url`). Headers are dropped, the Authorization header with them: nothing is kept of
 * the command but the request.
 */
function parseCurlCommand(text: string): CurlRequest | null {
  const words = splitShellWords(text)
  if (!words) return null
  // A line copied with its prompt
  if (words[0] === '$') words.shift()
  if (words[0] !== 'curl') return null

  let url: string | undefined
  const data: string[] = []

  for (let i = 1; i < words.length; i++) {
    let word = words[i]

    if (word === '--') {
      url ??= words.slice(i + 1).find((rest) => HTTP_URL.test(rest))
      break
    }

    if (word.startsWith('--')) {
      let value: string | undefined
      const equals = word.indexOf('=')
      if (equals !== -1) {
        value = word.slice(equals + 1)
        word = word.slice(0, equals)
      } else if (VALUED_OPTIONS.has(word)) {
        i++
        value = words[i]
      }
      if (value === undefined) continue
      if (word === '--url') url ??= value
      else if (DATA_OPTIONS.has(word)) data.push(value)
      continue
    }

    if (word.startsWith('-') && word.length > 1) {
      // Bundled short options, e.g. `-sSLd` or `-dBODY`
      for (let j = 1; j < word.length; j++) {
        const option = `-${word[j]}`
        if (!VALUED_OPTIONS.has(option)) continue
        let value: string | undefined
        if (j + 1 < word.length) {
          // The value attached, `-dBODY`
          value = word.slice(j + 1)
        } else {
          i++
          value = words[i]
        }
        if (value !== undefined && DATA_OPTIONS.has(option)) data.push(value)
        break
      }
      continue
    }

    if (url === undefined && HTTP_URL.test(word)) url = word
  }

  if (url === undefined) return null
  return {url, data: data.length > 0 ? data.join('&') : undefined}
}

/** The JSON body `@sanity/client` posts a query as, `{query, params}` */
function parseQueryBody(data: string): {query: string; params: Record<string, unknown>} | null {
  let body: unknown
  try {
    body = JSON.parse(data)
  } catch {
    return null
  }
  if (!isPlainObject(body) || typeof body.query !== 'string') return null
  const params = body.params ?? {}
  if (!isPlainObject(params)) return null
  return {query: body.query, params}
}

/**
 * Parses a curl command for a Content Lake query into the pieces of a tab, as a browser's network
 * tab copies it ("Copy as cURL") or Vision's own export writes it. The query and its params may
 * be in the URL or, as `@sanity/client` sends them once they are too long for a URL, in a JSON
 * body (`-d`, `--data-raw`, `--json`, …); a body wins over the URL, as it does at the API. The
 * rest of the request is read off the URL as for a pasted one (`parseQueryUrl`): the API version
 * and the dataset from its path, the perspective, the variant and the source map option from its
 * query string. Options a tab has no setting for (`tag`, `returnQuery`, …) and curl options the
 * parser does not know are passed over, and never keep a command from loading. Returns `null` for
 * anything that is not such a command.
 */
export function parseCurlQuery(text: string, datasets: readonly string[]): ParsedQueryUrl | null {
  const request = parseCurlCommand(text)
  if (!request) return null
  if (request.data === undefined) return parseQueryUrl(request.url, datasets)

  const body = parseQueryBody(request.data)
  if (!body) return null
  let url: URL
  try {
    url = new URL(request.url)
  } catch {
    return null
  }
  const {options} = splitQuerySearchParams(url.searchParams)
  options.set('query', body.query)
  for (const [key, value] of Object.entries(body.params)) {
    if (value !== undefined) options.set(`$${key}`, JSON.stringify(value))
  }
  url.search = options.toString()
  return parseQueryUrl(url.href, datasets)
}

/**
 * Parses a paste into the pieces of a tab: a Content Lake query URL (`parseQueryUrl`), or a curl
 * command sending one (`parseCurlQuery`). Returns `null` for anything else, which the paste
 * handler then leaves to the editor.
 */
export function parseQueryPaste(
  text: string,
  datasets: readonly string[],
): ParsedQueryPaste | null {
  const url = parseQueryUrl(text, datasets)
  if (url) return {...url, source: 'url'}
  const curl = parseCurlQuery(text, datasets)
  return curl ? {...curl, source: 'curl'} : null
}

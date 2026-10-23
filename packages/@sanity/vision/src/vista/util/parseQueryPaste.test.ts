import {describe, expect, it} from 'vitest'

import {encodeQueryString} from '../../util/encodeQueryString'
import {type ParsedQueryUrl, parseQueryUrl} from '../../util/parseQueryUrl'
import {QUERY_URL_SIZE_LIMIT} from '../../util/queryRequestMethod'
import {buildExportSnippets} from './exportSnippets'
import {parseCurlQuery, parseQueryPaste} from './parseQueryPaste'
import {parsedQueryToTabInit} from './savedQueryTab'

const datasets = ['production', 'staging']
const base = 'https://abc123.apicdn.sanity.io/v2025-02-19/data/query/production'

/** `parseCurlQuery` for a command that has to parse */
function parseCurl(text: string): ParsedQueryUrl {
  const parsed = parseCurlQuery(text, datasets)
  if (!parsed) throw new Error('expected the command to parse')
  return parsed
}

describe('parseCurlQuery', () => {
  it('reads the URL out of a command copied from a browser, dropping its headers', () => {
    // Chrome's "Copy as cURL (bash)", token and all
    const copied = [
      `curl '${base}?query=*%5B_id+%3D%3D+%24id%5D&%24id=%22a%22&perspective=drafts' \\`,
      `  -H 'accept: application/json' \\`,
      `  -H 'authorization: Bearer skSECRET' \\`,
      `  -H 'origin: http://localhost:3333' \\`,
      `  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' \\`,
      `  --compressed`,
    ].join('\n')
    const parsed = parseCurlQuery(copied, datasets)
    expect(parsed).toMatchObject({
      query: '*[_id == $id]',
      params: {id: 'a'},
      dataset: 'production',
      isKnownDataset: true,
      apiVersion: 'v2025-02-19',
      perspective: 'drafts',
      useCdn: true,
      url: `${base}?query=*%5B_id+%3D%3D+%24id%5D&%24id=%22a%22&perspective=drafts`,
    })
    expect(JSON.stringify(parsed)).not.toContain('skSECRET')

    // Firefox puts the URL first and the options after, in double quotes on Windows
    expect(
      parseCurlQuery(
        `curl "${base}?query=*" --compressed -H "Accept: */*" -H "Authorization: Bearer skSECRET"`,
        datasets,
      )?.query,
    ).toBe('*')
  })

  it('reads a posted query and its params out of the body, as the client sends them past the URL size limit', () => {
    const query = `*[_type == 'author' && _id == $id]{name} // ${'x'.repeat(QUERY_URL_SIZE_LIMIT)}`
    const params = {id: "it's", limit: 2}
    // The POST form Vision exports: the options in the URL, the query and params as JSON
    const [curl] = buildExportSnippets({
      query,
      params,
      url: `${base}${encodeQueryString(query, params)}&perspective=published`,
      projectId: 'abc123',
      dataset: 'production',
      apiVersion: 'v2025-02-19',
      perspective: 'published',
      variant: undefined,
      includeSourceMap: false,
      useCdn: true,
    })
    expect(curl.method).toBe('POST')

    const parsed = parseCurlQuery(curl.code, datasets)
    expect(parsed).toMatchObject({query, params, perspective: 'published', useCdn: true})
    // The URL is the GET form of the request, which Vision's URL field and saved queries use
    expect(parseQueryUrl(parsed?.url ?? '', datasets)).toEqual(parsed)
    expect(parsed?.url).toContain('perspective=published')
  })

  it('reads the body from every way curl takes one, in bash quoting', () => {
    const body = JSON.stringify({query: '*[_id == $id]', params: {id: 'a'}})
    const expected = {query: '*[_id == $id]', params: {id: 'a'}}
    const url = `${base}?perspective=published`

    expect(parseCurlQuery(`curl -X POST '${url}' -d '${body}'`, datasets)).toMatchObject(expected)
    expect(parseCurlQuery(`curl '${url}' --data '${body}'`, datasets)).toMatchObject(expected)
    expect(parseCurlQuery(`curl '${url}' --data-binary '${body}'`, datasets)).toMatchObject(
      expected,
    )
    expect(parseCurlQuery(`curl --json '${body}' --url '${url}'`, datasets)).toMatchObject(expected)
    expect(parseCurlQuery(`curl '${url}' --data-raw='${body}'`, datasets)).toMatchObject(expected)
    expect(parseCurlQuery(`curl '${url}' -d'${body}'`, datasets)).toMatchObject(expected)
    // Hand-written and docs often bundle `-d` with silent/follow flags
    expect(parseCurlQuery(`curl -sSLd '${body}' '${url}'`, datasets)).toMatchObject(expected)
    // Chrome quotes a body with quotes or backslashes in it (a JSON newline is `\n`) in ANSI-C
    expect(
      parseCurlQuery(
        `curl '${url}' \\\n  --data-raw $'{"query":"*[\\\\n  _id == \\'a\\'\\\\n]","params":{}}'`,
        datasets,
      )?.query,
    ).toBe("*[\n  _id == 'a'\n]")
    // Posted params without a value are left out, as the client leaves them out of a URL
    expect(parseCurlQuery(`curl '${url}' -d '{"query":"*"}'`, datasets)?.params).toEqual({})
    // The body wins over a query in the URL, as it does at the API
    expect(
      parseCurlQuery(`curl '${base}?query=count(*)&%24id=1' -d '${body}'`, datasets),
    ).toMatchObject(expected)
    expect(
      parseCurlQuery(`curl -sSLd '${body}' '${base}?query=count(*)&%24id=1'`, datasets),
    ).toMatchObject(expected)
  })

  it('reads the API version and dataset from the path, and a URL with no options as the API defaults', () => {
    // Nothing but the query, as a hand-written command has it. The path always names the API
    // version and the dataset, so the tab goes on them; the request ran on the API default
    // perspective, without a variant or a source map, and went to the API rather than its CDN,
    // so that is what the tab sends from now on
    const api = 'https://abc123.api.sanity.io/v2021-10-21/data/query/staging'
    const plain = parseCurl(`curl '${api}?query=*'`)
    expect(plain).toStrictEqual({
      query: '*',
      params: {},
      rawParams: '{}',
      dataset: 'staging',
      isKnownDataset: true,
      apiVersion: 'v2021-10-21',
      urlPerspective: undefined,
      perspective: undefined,
      hasUnsupportedPerspective: false,
      variant: undefined,
      includeSourceMap: false,
      useCdn: false,
      url: `${api}?query=*`,
    })
    expect(parsedQueryToTabInit(plain)).toStrictEqual({
      query: '*',
      rawParams: '{}',
      options: {
        datasetMode: 'pinned',
        dataset: 'staging',
        apiVersion: 'v2021-10-21',
        perspective: undefined,
        variant: 'none',
        includeSourceMap: false,
        useCdn: false,
      },
    })
    // The same request posted reads the same, its URL being the GET form of the request
    expect(
      parseCurl(`curl -X POST '${api}' -H 'content-type: application/json' -d '{"query":"*"}'`),
    ).toStrictEqual(plain)
  })

  it('reads every option a tab has a setting for out of the URL, passing over the rest', () => {
    // Every option `@sanity/client` writes into a query URL, as a browser copies the request. The
    // perspective, the variant and the source map go on the tab, which has a setting for each;
    // `tag`, `returnQuery`, `lastLiveEventId` and `cacheMode` have none, and are passed over
    const options =
      'perspective=published&variant=french&resultSourceMap=withKeyArraySelector' +
      '&tag=my.app&returnQuery=false&lastLiveEventId=evt1&cacheMode=noStale'
    const expected = {
      query: '*[_type == $type]',
      params: {type: 'author'},
      dataset: 'production',
      isKnownDataset: true,
      apiVersion: 'v2025-02-19',
      urlPerspective: 'published',
      perspective: 'published',
      hasUnsupportedPerspective: false,
      variant: 'french',
      includeSourceMap: true,
      useCdn: true,
    }
    const full = parseCurl(
      `curl '${base}?query=*%5B_type+%3D%3D+%24type%5D&%24type=%22author%22&${options}' -H 'authorization: Bearer skSECRET' --compressed`,
    )
    expect(full).toMatchObject(expected)
    expect(parsedQueryToTabInit(full).options).toStrictEqual({
      datasetMode: 'pinned',
      dataset: 'production',
      apiVersion: 'v2025-02-19',
      perspective: 'published',
      variant: 'global',
      includeSourceMap: true,
      useCdn: true,
    })

    // Posted, the options stay in the URL while the query and params move to the body
    const posted = parseCurl(
      `curl '${base}?${options}' -H 'content-type: application/json' --data-raw '{"query":"*[_type == $type]","params":{"type":"author"}}'`,
    )
    expect(posted).toMatchObject(expected)
    // The GET form of the request keeps what was passed over, since that is how it was sent
    expect(posted.url).toContain('tag=my.app')
    expect(parseQueryUrl(posted.url, datasets)).toStrictEqual(posted)
  })

  it('loads the query whatever it cannot read, leaving that to the tab', () => {
    // curl options the parser does not know, API options the tool has no setting for, an API
    // version that is not a date, a perspective a tab cannot pick (a release stack) and a dataset
    // the tool does not see: the query still loads, and the paste handler says what was left
    const parsed = parseCurl(
      `curl --fail-with-body --retry 3 -Z 'https://abc123.api.sanity.io/v2025-13-01/data/query/other?query=*&explain=true&perspective=rXYZ%2Cdrafts&foo=bar' -H 'x-sanity-ratelimit-bypass: 1'`,
    )
    expect(parsed).toMatchObject({
      query: '*',
      params: {},
      dataset: 'other',
      isKnownDataset: false,
      apiVersion: undefined,
      urlPerspective: 'rXYZ,drafts',
      perspective: undefined,
      hasUnsupportedPerspective: true,
    })
    // ...so the tab keeps its own dataset, API version and perspective
    expect(parsedQueryToTabInit(parsed).options).toStrictEqual({
      variant: 'none',
      includeSourceMap: false,
      useCdn: false,
    })
  })

  it('does not take the value of an option for the URL', () => {
    expect(
      parseCurlQuery(
        `curl -s -o out.json -w '%{http_code}' -u 'me:https://x.y' -X GET -H 'Referer: https://abc123.api.sanity.io/v1/data/query/other?query=1' '${base}?query=*'`,
        datasets,
      )?.query,
    ).toBe('*')
    expect(
      parseCurlQuery(`curl -sSL '${base}?query=*' -- 'https://ignored.example/'`, datasets)?.query,
    ).toBe('*')
  })

  it('returns null for anything that is not a curl command for a query', () => {
    expect(parseCurlQuery('*[_type == "author"]', datasets)).toBeNull()
    expect(parseCurlQuery(`${base}?query=*`, datasets)).toBeNull()
    expect(parseCurlQuery(`wget '${base}?query=*'`, datasets)).toBeNull()
    expect(parseCurlQuery(`curl 'https://www.sanity.io/docs'`, datasets)).toBeNull()
    expect(parseCurlQuery('curl -H "Accept: */*"', datasets)).toBeNull()
    expect(parseCurlQuery(`curl '${base}?query=*`, datasets)).toBeNull()
    // A mutation, a body that is not a query, and no query anywhere
    expect(
      parseCurlQuery(
        `curl 'https://abc123.api.sanity.io/v2025-02-19/data/mutate/production' -d '{"mutations":[]}'`,
        datasets,
      ),
    ).toBeNull()
    expect(parseCurlQuery(`curl '${base}' -d 'query=*'`, datasets)).toBeNull()
    expect(parseCurlQuery(`curl '${base}' -d '{"params":{}}'`, datasets)).toBeNull()
    expect(parseCurlQuery(`curl '${base}' -d '{"query":"*","params":[]}'`, datasets)).toBeNull()
    expect(parseCurlQuery(`curl '${base}?perspective=drafts'`, datasets)).toBeNull()
  })
})

describe('parseQueryPaste', () => {
  it('tells a pasted URL from a pasted command', () => {
    const url = `${base}?query=*`
    expect(parseQueryPaste(url, datasets)).toMatchObject({source: 'url', query: '*'})
    expect(parseQueryPaste(`$ curl '${url}'`, datasets)).toMatchObject({source: 'curl', query: '*'})
    expect(parseQueryPaste(`see ${url}`, datasets)).toBeNull()
  })
})

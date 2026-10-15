import {dequal} from 'dequal/lite'

import {type FetchHistoryEntry} from '../store/types'

export type RequestChangeId = 'query' | 'params' | 'url'

export interface RequestChange {
  id: RequestChangeId
  /** Text diffed line by line */
  previous: string
  next: string
  lang: 'json' | 'text'
}

type FetchedRequest = Pick<FetchHistoryEntry, 'query' | 'params' | 'url'>

/**
 * The parts of a query URL that can change the result besides the query and params, one per
 * line: the API host, version and dataset in the path, then the options. The query and params
 * have diffs of their own, and a Content Source Map does not change the result.
 */
export function describeRequestUrl(url: string): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return `${url}\n`
  }
  const lines = [`${parsed.origin}${parsed.pathname}`]
  for (const [key, value] of parsed.searchParams) {
    if (key === 'query' || key === 'resultSourceMap' || key.startsWith('$')) continue
    lines.push(`${key}=${value}`)
  }
  return `${lines.join('\n')}\n`
}

function withTrailingNewline(text: string): string {
  return text.endsWith('\n') ? text : `${text}\n`
}

function toJson(params: Record<string, unknown>): string {
  return `${JSON.stringify(params, null, 2)}\n`
}

/** What differs between the requests of two fetches, in the order the diffs are shown */
export function getRequestChanges(previous: FetchedRequest, next: FetchedRequest): RequestChange[] {
  const changes: RequestChange[] = []
  if (previous.query !== next.query) {
    changes.push({
      id: 'query',
      previous: withTrailingNewline(previous.query),
      next: withTrailingNewline(next.query),
      lang: 'text',
    })
  }
  if (!dequal(previous.params, next.params)) {
    changes.push({
      id: 'params',
      previous: toJson(previous.params),
      next: toJson(next.params),
      lang: 'json',
    })
  }
  const previousUrl = describeRequestUrl(previous.url)
  const nextUrl = describeRequestUrl(next.url)
  if (previousUrl !== nextUrl) {
    changes.push({id: 'url', previous: previousUrl, next: nextUrl, lang: 'text'})
  }
  return changes
}

import {omit} from 'lodash'
import {RouterPanes, RouterPaneGroup, RouterPaneSibling} from './types'
import {route} from 'sanity/router'

const EMPTY_PARAMS = {}

/**
 * @internal
 */
export function legacyEditParamsToState(params: string): Record<string, unknown> {
  try {
    return JSON.parse(decodeURIComponent(params))
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to parse JSON parameters')
    return {}
  }
}

export function encodePanesSegment(panes: RouterPanes): string {
  return (panes || [])
    .map((group) => group.map(encodeChunks).join('|'))
    .map(encodeURIComponent)
    .join(';')
}

/**
 * @internal
 */
export function legacyEditParamsToPath(params: Record<string, unknown>): string {
  return JSON.stringify(params)
}

// http://localhost:3333/intent/create/template=book-by-author;type=book/eyJhdXRob3JJZCI6Imdycm0ifQ==

/**
 * @internal
 */
export function toState(pathSegment: string): RouterPaneGroup[] {
  return parsePanesSegment(decodeURIComponent(pathSegment))
}

/**
 * @internal
 */
export function toPath(panes: RouterPaneGroup[]): string {
  return encodePanesSegment(panes)
}

export const router = route.create('/', [
  // "Asynchronous intent resolving" route
  route.intents('/intent'),

  // Legacy fallback route, will be redirected to new format
  route.create('/edit/:type/:editDocumentId', [
    route.create({
      path: '/:params',
      transform: {params: {toState: legacyEditParamsToState, toPath: legacyEditParamsToPath}},
    }),
  ]),

  // The regular path - when the intent can be resolved to a specific pane
  route.create({
    path: '/:panes',
    // Legacy URLs, used to handle redirects
    children: [route.create('/:action', route.create('/:legacyEditDocumentId'))],
    transform: {
      panes: {toState, toPath},
    },
  }),
])

// old: authors;knut,{"template":"diaryEntry"}
// new: authors;knut,view=diff,eyJyZXYxIjoiYWJjMTIzIiwicmV2MiI6ImRlZjQ1NiJ9|latest-posts

const panePattern = /^([.a-z0-9_-]+),?({.*?})?(?:(;|$))/i
const isParam = (str: string) => /^[a-z0-9]+=[^=]+/i.test(str)
const isPayload = (str: string) =>
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(str)
const exclusiveParams = ['view', 'since', 'rev']

type Truthy<T> = T extends false
  ? never
  : T extends ''
  ? never
  : T extends 0
  ? never
  : T extends 0n
  ? never
  : T extends null | undefined
  ? NonNullable<T>
  : T
const isTruthy = Boolean as (t: unknown) => boolean as <T>(t: T) => t is Truthy<T>

function parseChunks(chunks: string[], initial: RouterPaneSibling): RouterPaneSibling {
  return chunks.reduce(
    (pane, chunk) => {
      if (isParam(chunk)) {
        const key = chunk.slice(0, chunk.indexOf('='))
        const value = chunk.slice(key.length + 1)
        pane.params = {...pane.params, [decodeURIComponent(key)]: decodeURIComponent(value)}
      } else if (isPayload(chunk)) {
        pane.payload = tryParseBase64Payload(chunk)
      } else {
        // eslint-disable-next-line no-console
        console.warn('Unknown pane segment: %s - skipping', chunk)
      }

      return pane
    },
    {...initial, params: EMPTY_PARAMS, payload: undefined}
  )
}

function encodeChunks(pane: RouterPaneSibling, index: number, group: RouterPaneGroup): string {
  const {payload, params = {}, id} = pane
  const [firstSibling] = group
  const paneIsFirstSibling = pane === firstSibling
  const sameAsFirst = index !== 0 && id === firstSibling.id
  const encodedPayload = typeof payload === 'undefined' ? undefined : btoa(JSON.stringify(payload))

  const encodedParams = Object.entries(params)
    .filter((entry): entry is [string, string] => {
      const [key, value] = entry
      if (!value) return false
      if (paneIsFirstSibling) return true

      // omit the value if it's the same as the value from the first sibling
      const valueFromFirstSibling = firstSibling.params?.[key]
      if (value === valueFromFirstSibling && !exclusiveParams.includes(key)) return false
      return true
    })
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)

  return (
    [sameAsFirst ? '' : id]
      .concat([encodedParams.length > 0 && encodedParams, encodedPayload].filter(isTruthy).flat())
      .join(',') || ','
  )
}

export function parsePanesSegment(str: string): RouterPanes {
  if (str.indexOf(',{') !== -1) {
    return parseOldPanesSegment(str)
  }

  return str
    .split(';')
    .map((group) => {
      const [firstSibling, ...restOfSiblings] = group.split('|').map((segment) => {
        const [id, ...chunks] = segment.split(',')
        return parseChunks(chunks, {id})
      })

      return [
        firstSibling,
        ...restOfSiblings.map((sibling) => ({
          ...firstSibling,
          ...sibling,
          id: sibling.id || firstSibling.id,
          params: {...omit(firstSibling.params, exclusiveParams), ...sibling.params},
          payload: sibling.payload || firstSibling.payload,
        })),
      ]
    })
    .filter((group) => group.length > 0)
}

function parseOldPanesSegment(str: string): RouterPanes {
  const chunks: RouterPaneGroup = []

  let buffer = str
  while (buffer.length) {
    const [match, id, payloadChunk] = buffer.match(panePattern) || []
    if (!match) {
      buffer = buffer.slice(1)
      continue
    }

    const payload = payloadChunk && tryParsePayload(payloadChunk)
    chunks.push({id, payload})

    buffer = buffer.slice(match.length)
  }

  return [chunks]
}

function tryParsePayload(json: string) {
  try {
    return JSON.parse(json)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to parse parameters: ${err.message}`)
    return undefined
  }
}

function tryParseBase64Payload(data: string) {
  return data ? tryParsePayload(atob(data)) : undefined
}

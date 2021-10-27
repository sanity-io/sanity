import isHotkey from 'is-hotkey'
import {Observable, merge, of} from 'rxjs'
import {mapTo, delay} from 'rxjs/operators'
import {RouterPaneGroup} from './types'
import {parsePanesSegment, encodePanesSegment} from './utils/parsePanesSegment'

declare const __DEV__: boolean

/**
 * @internal
 */
export const isSaveHotkey: (event: KeyboardEvent) => boolean = isHotkey('mod+s')

interface GetIntentRouteParamsOptions {
  id: string
  type?: string
  templateName?: string
  payloadParams?: Record<string, unknown>
}

/**
 * @internal
 */
export function getIntentRouteParams({
  id,
  type,
  payloadParams,
  templateName,
}: GetIntentRouteParamsOptions): {
  intent: 'edit'
  params: {id: string; type?: string; templateName?: string}
  payload: Record<string, unknown> | undefined
} {
  return {
    intent: 'edit',
    params: {
      id,
      ...(type ? {type} : {}),
      ...(templateName ? {template: templateName} : {}),
    },
    payload: Object.keys(payloadParams || {}).length > 0 ? payloadParams : undefined,
  }
}

/**
 * @internal
 */
export function getWaitMessages(path: string[]): Observable<string> {
  const thresholds = [
    {ms: 300, message: 'Loading…'},
    {ms: 5000, message: 'Still loading…'},
  ]

  if (__DEV__) {
    const message = [
      'Check console for errors?',
      'Is your observable/promise resolving?',
      path.length > 0 ? `Structure path: ${path.join(' ➝ ')}` : '',
    ]

    thresholds.push({
      ms: 10000,
      message: message.join('\n'),
    })
  }

  const src = of(null)

  return merge(...thresholds.map(({ms, message}) => src.pipe(mapTo(message), delay(ms))))
}

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

/**
 * @internal
 */
export function legacyEditParamsToPath(params: Record<string, unknown>): string {
  return JSON.stringify(params)
}

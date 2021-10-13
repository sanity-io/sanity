import isHotkey from 'is-hotkey'
import {merge, of} from 'rxjs'
import {mapTo, delay} from 'rxjs/operators'
import {RouterPaneGroup} from './types'
import {LOADING_PANE} from './constants'
import {parsePanesSegment, encodePanesSegment} from './utils/parsePanesSegment'

/**
 * @internal
 */
export const hasLoading = (panes: any) => panes.some((item) => item === LOADING_PANE)

/**
 * @internal
 */
export const isSaveHotkey: (event: KeyboardEvent) => boolean = isHotkey('mod+s')

/**
 * @internal
 */
export function getPaneDiffIndex(nextPanes: any, prevPanes: any): [number, number] | undefined {
  if (!nextPanes.length) {
    return [0, 0]
  }

  const maxPanes = Math.max(nextPanes.length, prevPanes.length)
  for (let index = 0; index < maxPanes; index++) {
    const nextGroup = nextPanes[index]
    const prevGroup = prevPanes[index]

    // Whole group is now invalid
    if (!prevGroup || !nextGroup) {
      return [index, 0]
    }

    // Less panes than previously? Resolve whole group
    if (prevGroup.length > nextGroup.length) {
      return [index, 0]
    }

    /* eslint-disable max-depth */
    // Iterate over siblings
    for (let splitIndex = 0; splitIndex < nextGroup.length; splitIndex++) {
      const nextSibling = nextGroup[splitIndex]
      const prevSibling = prevGroup[splitIndex]

      // Didn't have a sibling here previously, diff from here!
      if (!prevSibling) {
        return [index, splitIndex]
      }

      // Does the ID differ from the previous?
      if (nextSibling.id !== prevSibling.id) {
        return [index, splitIndex]
      }
    }
    /* eslint-enable max-depth */
  }

  // "No diff"
  return undefined
}

/**
 * @internal
 */
export function getIntentRouteParams({id, type, payloadParams, templateName}) {
  return {
    intent: 'edit',
    params: {
      id,
      ...(type ? {type} : {}),
      ...(templateName ? {template: templateName} : {}),
    },
    payload: Object.keys(payloadParams).length > 0 ? payloadParams : undefined,
  }
}

/**
 * @internal
 */
export function getWaitMessages(path) {
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
export function legacyEditParamsToState(params) {
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
export function legacyEditParamsToPath(params: Record<string, unknown>) {
  return JSON.stringify(params)
}

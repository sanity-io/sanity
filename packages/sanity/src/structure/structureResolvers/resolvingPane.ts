import omit from 'lodash-es/omit.js'

import {type RouterPaneGroup, type RouterPanes, type RouterPaneSibling} from '../types'

/**
 * Prefix of the pane that renders a document while its intent link is still
 * being resolved to a place in the structure. Unlike `__edit__`, which is a
 * final destination, a `__resolve__` pane is replaced by the resolved path.
 *
 * @internal
 */
export const RESOLVING_PANE_ID_PREFIX = '__resolve__'

const FALLBACK_EDITOR_PANE_ID_PREFIX = '__edit__'

const FALLBACK_EDITOR_PREFIX_PATTERN = /^__(edit|resolve)__/

/** @internal */
export function isResolvingPaneId(id: string): boolean {
  return id.startsWith(RESOLVING_PANE_ID_PREFIX)
}

/**
 * Whether the pane renders the implicit fallback editor (`__edit__<id>` or
 * `__resolve__<id>`) instead of a child of the previous pane.
 *
 * @internal
 */
export function isFallbackEditorPaneId(id: string): boolean {
  return id.startsWith(FALLBACK_EDITOR_PANE_ID_PREFIX) || isResolvingPaneId(id)
}

/** @internal */
export function getDocumentIdFromPaneId(id: string): string {
  return id.replace(FALLBACK_EDITOR_PREFIX_PATTERN, '')
}

/**
 * An intent that the structure tool resolves to a path of panes.
 *
 * @internal
 */
export interface IntentRequest {
  intent: string
  params: {type: string; id: string; [key: string]: string | undefined}
  payload: unknown
}

/**
 * Pane params that belong to the pane the user is looking at rather than to the
 * intent, so they survive when the resolved path replaces the resolving pane.
 */
const INTENT_ONLY_PARAMS = ['intent', 'type']

/**
 * The panes that open the document of an intent right away, while the intent is
 * resolved in the background.
 *
 * @internal
 */
export function createResolvingPanes({intent, params, payload}: IntentRequest): RouterPanes {
  const {id, ...rest} = params
  return [
    [
      {
        id: `${RESOLVING_PANE_ID_PREFIX}${id}`,
        params: intent === 'edit' ? rest : {...rest, intent},
        payload,
      },
    ],
  ]
}

/**
 * Rebuilds the intent of a resolving pane, or returns `undefined` when the
 * first pane group is not one.
 *
 * @internal
 */
export function getResolvingRequest(panes: RouterPanes | undefined): IntentRequest | undefined {
  const pane = panes?.[0]?.[0]
  if (!pane || !isResolvingPaneId(pane.id)) return undefined

  const {intent = 'edit', type, ...params} = pane.params || {}
  if (!type) return undefined

  return {
    intent,
    params: {...params, type, id: getDocumentIdFromPaneId(pane.id)},
    payload: pane.payload,
  }
}

/**
 * Replaces the pane group of a resolving pane with the resolved path. Groups
 * after it (a reference the user opened, say) are kept, and so are the params
 * of every sibling in the group (the view, inspector or focus path the user
 * picked while the intent was resolving). Returns `undefined` when the user has
 * navigated away from the resolving pane.
 *
 * @internal
 */
export function applyResolvedIntent(
  currentPanes: RouterPanes,
  resolvingPaneId: string,
  resolvedPanes: RouterPanes,
): RouterPanes | undefined {
  const groupIndex = currentPanes.findIndex((group) =>
    group.some((sibling) => sibling.id === resolvingPaneId),
  )
  const target = resolvedPanes.at(-1)?.[0]
  if (groupIndex === -1 || !target) return undefined

  const carriedGroup: RouterPaneGroup = currentPanes[groupIndex].map(
    (sibling): RouterPaneSibling => {
      const params = {...target.params, ...omit(sibling.params, INTENT_ONLY_PARAMS)}
      return {
        ...sibling,
        id: target.id,
        params: Object.keys(params).length ? params : undefined,
        payload: target.payload,
      }
    },
  )

  return [...resolvedPanes.slice(0, -1), carriedGroup, ...currentPanes.slice(groupIndex + 1)]
}

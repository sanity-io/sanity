import omit from 'lodash-es/omit.js'

import {type RouterPaneGroup, type RouterPanes, type RouterPaneSibling} from '../types'
import {type ResolveIntentOptions} from './resolveIntent'

// like `__edit__`, but replaced by the resolved path once the intent resolves
const RESOLVING_PANE_ID_PREFIX = '__resolve__'

const FALLBACK_EDITOR_PREFIX_PATTERN = /^__(edit|resolve)__/

/** @internal */
export function isResolvingPaneId(id: string): boolean {
  return id.startsWith(RESOLVING_PANE_ID_PREFIX)
}

/** @internal */
export function isFallbackEditorPaneId(id: string): boolean {
  return FALLBACK_EDITOR_PREFIX_PATTERN.test(id)
}

/** @internal */
export function getDocumentIdFromPaneId(id: string): string {
  return id.replace(FALLBACK_EDITOR_PREFIX_PATTERN, '')
}

/** @internal */
export type IntentRequest = Omit<ResolveIntentOptions, 'rootPaneNode' | 'structureContext'>

/** @internal */
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

/** @internal */
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
 * Keeps the groups opened to the right and each sibling's own params (view,
 * inspector). Returns `undefined` once the user has navigated away.
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
      // the resolving pane already applied the intent's mode (StructureTool consumes `mode=focus`)
      const params = {...omit(target.params, ['mode']), ...omit(sibling.params, ['intent', 'type'])}
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

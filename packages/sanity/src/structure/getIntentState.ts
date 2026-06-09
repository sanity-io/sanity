import {uuid} from '@sanity/uuid'

import {EMPTY_PARAMS, type LOADING_PANE} from './constants'
import {type PaneNode, type RouterPanes} from './types'

const state: {
  activePanes: Array<PaneNode | typeof LOADING_PANE>
} = {activePanes: []}

export function setActivePanes(panes: Array<PaneNode | typeof LOADING_PANE>): void {
  state.activePanes = panes
}

/**
 * This function looks at the _active panes_ to resolve an intent. this type of
 * intent resolution is faster and does not cause the panes to reset
 *
 * @internal
 */
export function getIntentState(
  intent: string,
  params: Record<string, string>,
  routerState: {panes?: RouterPanes} | undefined,
  payload: unknown,
): {panes: RouterPanes} | {intent: string; params: Record<string, string>; payload: unknown} {
  const panes = routerState?.panes || []
  const activePanes = state.activePanes || []
  const editDocumentId = params.id || uuid()

  // Loop through open panes and see if any of them can handle the intent
  for (let i = activePanes.length - 1; i >= 0; i--) {
    const pane = activePanes[i]

    if (typeof pane !== 'object') continue

    // NOTE: if you update this logic, please also update the similar handler in
    // `resolveIntent.ts`
    if (
      pane.canHandleIntent?.(intent, params, {
        pane,
        index: i,
      }) ||
      // see `resolveIntent.ts` for more info
      (pane.type === 'documentList' &&
        pane.schemaTypeName === params.type &&
        pane.options.filter === '_type == $type')
    ) {
      const paneParams = getPaneParams(intent, params)

      return {
        panes: panes
          .slice(0, i)
          .concat([[{id: editDocumentId, params: paneParams, payload}]]) as RouterPanes,
      }
    }
  }

  return {intent: intent, params, payload}
}

function getPaneParams(
  intent: string,
  {
    template,
    version,
    inspect,
    comment,
    task,
    scheduledDraft,
    path,
    rev,
    since,
    historyEvent,
    historyVersion,
    archivedRelease,
  }: Record<string, string>,
): {
  template?: string
  version?: string
  inspect?: string
  comment?: string
  task?: string
  scheduledDraft?: string
  path?: string
  rev?: string
  since?: string
  historyEvent?: string
  historyVersion?: string
  archivedRelease?: string
} {
  switch (intent) {
    case 'create':
      return {template, version}
    // Forward the document-pane intent params (notably `path` to deep-link/focus a
    // field, and the history/release params used to open a release version). The
    // cold-path resolver (`resolveIntent`) already forwards all params except id/type;
    // this fast-path previously dropped everything outside a small hardcoded list.
    case 'edit':
      return {
        inspect,
        comment,
        task,
        scheduledDraft,
        path,
        rev,
        since,
        historyEvent,
        historyVersion,
        archivedRelease,
      }
    default:
      return EMPTY_PARAMS
  }
}

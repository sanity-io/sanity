import {uuid} from '@sanity/uuid'
import {EMPTY_PARAMS} from './constants'
import {RouterPaneGroup, RouterSplitPane} from './types'

const state: {activePanes: any[]} = {activePanes: []}

export function setActivePanes(panes: any[]): void {
  state.activePanes = panes
}

/**
 * @internal
 */
export function getIntentState(
  intentName: string,
  params: Record<string, string | undefined>,
  currentState: {panes: RouterPaneGroup[]} | undefined,
  payload: unknown
):
  | {panes: RouterPaneGroup[]}
  | {intent: string; params: Record<string, string | undefined>; payload: unknown} {
  const paneSegments = (currentState && currentState.panes) || []
  const activePanes = state.activePanes || []
  const editDocumentId = params.id || uuid()
  const isTemplate = intentName === 'create' && params.template

  // Loop through open panes and see if any of them can handle the intent
  for (let i = activePanes.length - 1; i >= 0; i--) {
    const pane = activePanes[i]

    if (pane.canHandleIntent && pane.canHandleIntent(intentName, params, {pane, index: i})) {
      const paneParams: RouterSplitPane['params'] = isTemplate
        ? {template: params.template}
        : EMPTY_PARAMS

      return {
        panes: paneSegments
          .slice(0, i)
          .concat([[{id: editDocumentId, params: paneParams, payload}]]),
      }
    }
  }

  return {intent: intentName, params, payload}
}

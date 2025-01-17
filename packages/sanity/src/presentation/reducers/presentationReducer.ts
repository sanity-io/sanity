import {type Dispatch, type Reducer} from 'react'
import {boolean, fallback, object, parse, picklist} from 'valibot'

/** @public */
export interface PresentationState {
  mainDocument: boolean
  iframe: {
    status: 'loading' | 'loaded' | 'refreshing' | 'reloading'
  }
  visualEditing: {
    overlaysEnabled: boolean
  }
}

/** @public */
export const ACTION_IFRAME_LOADED = 'ACTION_IFRAME_LOADED'
/** @public */
export const ACTION_IFRAME_REFRESH = 'ACTION_IFRAME_REFRESH'
/** @public */
export const ACTION_IFRAME_RELOAD = 'ACTION_IFRAME_RELOAD'
/** @public */
export const ACTION_VISUAL_EDITING_OVERLAYS_TOGGLE = 'ACTION_VISUAL_EDITING_OVERLAYS_TOGGLE'

/** @public */
export interface IframeLoadedAction {
  type: typeof ACTION_IFRAME_LOADED
}
/** @public */
export interface IframeRefreshAction {
  type: typeof ACTION_IFRAME_REFRESH
}
/** @public */
export interface IframeReloadAction {
  type: typeof ACTION_IFRAME_RELOAD
}
/** @public */
export interface VisualEditingOverlaysToggleAction {
  type: typeof ACTION_VISUAL_EDITING_OVERLAYS_TOGGLE
  enabled: boolean
}

/** @public */
export type PresentationAction =
  | IframeLoadedAction
  | IframeRefreshAction
  | IframeReloadAction
  | VisualEditingOverlaysToggleAction

export const presentationReducer: Reducer<
  Readonly<PresentationState>,
  Readonly<PresentationAction>
> = (state, action) => {
  switch (action.type) {
    case ACTION_IFRAME_LOADED:
      return state.iframe.status === 'loaded'
        ? state
        : {
            ...state,
            iframe: {
              ...state.iframe,
              status: 'loaded',
            },
          }
    case ACTION_IFRAME_REFRESH:
      return state.iframe.status === 'refreshing'
        ? state
        : {
            ...state,
            iframe: {
              ...state.iframe,
              status: 'refreshing',
            },
          }
    case ACTION_IFRAME_RELOAD:
      return state.iframe.status === 'reloading'
        ? state
        : {
            ...state,
            iframe: {
              ...state.iframe,
              status: 'reloading',
            },
          }
    case ACTION_VISUAL_EDITING_OVERLAYS_TOGGLE:
      return toggleVisualEditingOverlays(state, action)
    default:
      return state
  }
}

const toggleVisualEditingOverlays: Reducer<
  Readonly<PresentationState>,
  Readonly<VisualEditingOverlaysToggleAction>
> = (state, action) => {
  if (state.visualEditing.overlaysEnabled === action.enabled) return state
  return {
    ...state,
    visualEditing: {
      ...state.visualEditing,
      overlaysEnabled: action.enabled,
    },
  }
}

const mainDocumentSchema = fallback(boolean(), false)

const iframeStatusSchema = picklist(['loading', 'loaded', 'refreshing', 'reloading'])

const initStateSchema = object({
  mainDocument: mainDocumentSchema,
  iframe: object({
    status: iframeStatusSchema,
  }),
  visualEditing: object({overlaysEnabled: boolean()}),
})

const INITIAL_PRESENTATION_STATE = {
  mainDocument: false,
  iframe: {
    status: 'loading',
  },
  visualEditing: {
    overlaysEnabled: false,
  },
} as const satisfies PresentationState

export function presentationReducerInit(
  state: Readonly<Partial<PresentationState>>,
): Readonly<PresentationState> {
  return parse(initStateSchema, {...INITIAL_PRESENTATION_STATE, ...state})
}

/** @public */
export type DispatchPresentationAction = Dispatch<Readonly<PresentationAction>>

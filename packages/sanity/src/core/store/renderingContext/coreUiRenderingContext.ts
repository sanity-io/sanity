import {
  catchError,
  distinctUntilChanged,
  map,
  of,
  type OperatorFunction,
  pipe,
  switchMap,
} from 'rxjs'

import {isCoreUiRenderingContext, type StudioRenderingContext} from './types'

// Core UI Rendering Context is provided via the URL query string, and remains static the entire
// duration Studio is rendered inside the Core UI iframe.
//
// However, the URL query string is liable to be lost during Studio's lifecycle (for example, when
// the user navigates to a different tool). Therefore, the URL query string is captured as soon as
// this code is evaluated, and later referenced when a consumer subscribes to the store.
const INITIAL_URL_SEARCH = typeof location === 'object' ? location.search : ''

const CORE_UI_MODE_NAME = 'core-ui'
const CORE_UI_CONTEXT_SEARCH_PARAM = '_context'

/**
 * @internal
 */
export function coreUiRenderingContext(
  urlSearch: string = INITIAL_URL_SEARCH,
): OperatorFunction<StudioRenderingContext | undefined, StudioRenderingContext | undefined> {
  return pipe(
    switchMap((renderingContext) => {
      if (renderingContext) {
        return of(renderingContext)
      }

      return of(urlSearch).pipe(
        distinctUntilChanged(),
        map((search) => new URLSearchParams(search).get(CORE_UI_CONTEXT_SEARCH_PARAM)),
        map((serializedContext) => {
          if (serializedContext === null) {
            return undefined
          }

          const {mode, env} = JSON.parse(serializedContext)

          const coreUirenderingContext = {
            name: mode === CORE_UI_MODE_NAME ? 'coreUi' : undefined,
            metadata: {
              environment: env,
            },
          }

          if (isCoreUiRenderingContext(coreUirenderingContext)) {
            return coreUirenderingContext
          }

          return undefined
        }),
        catchError((error) => {
          console.warn('Error parsing rendering context:', error)
          return of(undefined)
        }),
      )
    }),
  )
}

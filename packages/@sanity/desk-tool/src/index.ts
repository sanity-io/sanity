import {createPlugin, SanityPlugin} from '@sanity/base'
import {MasterDetailIcon} from '@sanity/icons'
import {lazy} from 'react'
import {DeskToolOptions} from './DeskToolRoot'
// import {DeskToolRoot} from './DeskToolRoot'
import {router} from './router'
// import {getIntentState} from './getIntentState'

export * from './constants'

// Export pane router
export * from './contexts/paneRouter/PaneRouterContext'
export * from './contexts/paneRouter/usePaneRouter'

export const desk = (options?: DeskToolOptions): SanityPlugin => {
  return createPlugin({
    tools: [
      {
        name: 'desk',
        title: 'Desk',
        icon: MasterDetailIcon,
        component: lazy(() => import('./DeskToolRoot')),
        // canHandleIntent,
        // getIntentState,
        options,
        router,
      },
    ],
  })
}

// function canHandleIntent(intentName: string, params: Record<string, string | undefined>) {
//   return Boolean(
//     (intentName === 'edit' && params.id) ||
//       (intentName === 'create' && params.type) ||
//       (intentName === 'create' && params.template)
//   )
// }

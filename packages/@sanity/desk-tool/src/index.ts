import {createPlugin, SanityPlugin} from '@sanity/base'
import {MasterDetailIcon} from '@sanity/icons'
import {lazy} from 'react'
import {DeskToolOptions} from './DeskToolRoot'
import {router} from './router'

export * from './actions/resolveDocumentActions'
export * from './constants'

// Export pane router
export * from './contexts/paneRouter/PaneRouterContext'
export * from './contexts/paneRouter/usePaneRouter'

export function deskTool(options?: DeskToolOptions): SanityPlugin {
  return createPlugin({
    tools: [
      {
        name: options?.name || 'desk',
        title: options?.title || 'Desk',
        icon: options?.icon || MasterDetailIcon,
        component: lazy(() => import('./DeskToolRoot')),
        // canHandleIntent,
        // getIntentState,
        options,
        router,
      },
    ],
  })
}

export type {DocumentActionsResolver, StructureResolver} from './types'

// function canHandleIntent(intentName: string, params: Record<string, string | undefined>) {
//   return Boolean(
//     (intentName === 'edit' && params.id) ||
//       (intentName === 'create' && params.type) ||
//       (intentName === 'create' && params.template)
//   )
// }

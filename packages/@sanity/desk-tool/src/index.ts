import {createPlugin, SanityPlugin} from '@sanity/base'
import {MasterDetailIcon} from '@sanity/icons'
import {lazy} from 'react'
import {DeskToolOptions} from './DeskToolRoot'
import {getIntentState} from './getIntentState'
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
        canHandleIntent,
        getIntentState,
        options,
        router,
      },
    ],
  })
}

export type {DocumentActionsResolver, StructureResolver} from './types'

function canHandleIntent(intent: string, params: Record<string, unknown>, _payload: unknown) {
  return Boolean(
    (intent === 'edit' && params.id) ||
      (intent === 'create' && params.type) ||
      (intent === 'create' && params.template)
  )
}

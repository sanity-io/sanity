import {MasterDetailIcon} from '@sanity/icons'
import {lazy} from 'react'
import {createPlugin} from '../config'
import {getIntentState} from './getIntentState'
import {router} from './router'
import {DeskToolOptions} from './types'

export * from './actions'
export * from './badges'

export type {DefaultDocumentNodeResolver, StructureBuilder} from './structureBuilder'

export * from './types'

/**
 * @alpha
 */
export const deskTool = createPlugin<DeskToolOptions | void>((options) => ({
  name: '@sanity/desk-tool',
  tools: [
    {
      name: options?.name || 'desk',
      title: options?.title || 'Desk',
      icon: options?.icon || MasterDetailIcon,
      component: lazy(() => import('./_lazyBoundary')),
      canHandleIntent: (intent, params) => {
        return Boolean(
          (intent === 'edit' && params.id) ||
            (intent === 'create' && params.type) ||
            (intent === 'create' && params.template)
        )
      },
      getIntentState,
      options,
      router,
    },
  ],
}))

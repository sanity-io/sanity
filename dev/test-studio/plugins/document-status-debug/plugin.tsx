import {CircleIcon} from '@sanity/icons/Circle'
import {definePlugin} from 'sanity'

import {DocumentStatusDebug} from './DocumentStatusDebug'

/**
 * Visual matrix of every `DocumentVersionsStatusIndicator` state, for eyeballing the icons against the
 * design without having to seed releases, variants and agent bundles in a dataset.
 */
export const documentStatusDebugTool = definePlugin(() => ({
  name: 'document-status-debug',
  tools: [
    {
      name: 'document-status-debug',
      title: 'Document status debug',
      icon: CircleIcon,
      component: DocumentStatusDebug,
    },
  ],
}))

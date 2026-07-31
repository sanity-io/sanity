import {TrashIcon} from '@sanity/icons/Trash'
import {definePlugin} from 'sanity'

import {UnknownTypeDocumentsTool} from './UnknownTypeDocumentsTool'

/**
 * Tool that lists all documents in the dataset whose `_type` does not match
 * any type registered in the workspace schema, and lets you delete them
 * (individually or all at once) to free up document quota.
 */
export const unknownTypeDocumentsTool = definePlugin(() => ({
  name: 'unknown-type-documents',
  tools: [
    {
      name: 'unknown-type-documents',
      title: 'Unknown types',
      icon: TrashIcon,
      component: UnknownTypeDocumentsTool,
    },
  ],
}))

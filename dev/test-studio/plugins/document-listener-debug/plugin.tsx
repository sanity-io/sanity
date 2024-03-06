import {BulbOutlineIcon} from '@sanity/icons'
import {definePlugin} from 'sanity'

import {DocumentListenerDebug} from './DocumentListenerDebug'
import {type DocumentListenerDebugConfig} from './types'

/**
 * Router playground/debug plugin
 */
export const documentListenerDebugTool = definePlugin<DocumentListenerDebugConfig | void>(
  (options) => {
    const {name, title, icon} = options || {}

    return {
      name: 'router-debug',
      tools: [
        {
          name: name || 'document-listener-debug',
          title: title || 'Document Listener debug',
          icon: icon || BulbOutlineIcon,
          component: DocumentListenerDebug,
        },
      ],
    }
  },
)

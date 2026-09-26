import {type ComponentType} from 'react'
import {type PluginOptions} from 'sanity'

import {type DocumentLayoutProps} from '../../../../core/config/types'

/**
 * Pick the document layout component when composing the component middleware chain.
 */
export function pickDocumentLayoutComponent(plugin: PluginOptions) {
  return plugin.document?.components?.unstable_layout as ComponentType<
    Omit<DocumentLayoutProps, 'renderDefault'>
  >
}

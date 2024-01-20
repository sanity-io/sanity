import {type ComponentType} from 'react'
import {type DocumentLayoutProps, type PluginOptions, useMiddlewareComponents} from 'sanity'

import {DocumentLayout} from './DocumentLayout'

function pick(plugin: PluginOptions) {
  return plugin.document?.components?.unstable_layout as ComponentType<
    Omit<DocumentLayoutProps, 'renderDefault'>
  >
}

/**
 * A hook that returns the document layout composed
 * by the Components API (`document.components.layout`).
 */
export function useDocumentLayoutComponent(): ComponentType<
  Omit<DocumentLayoutProps, 'renderDefault'>
> {
  return useMiddlewareComponents({
    pick,
    defaultComponent: DocumentLayout,
  })
}

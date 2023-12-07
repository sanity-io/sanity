import {ComponentType} from 'react'
import {DocumentLayout} from './DocumentLayout'
import {DocumentLayoutProps, PluginOptions, useMiddlewareComponents} from 'sanity'

function pick(plugin: PluginOptions) {
  return plugin.document?.components?.layout as ComponentType<
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

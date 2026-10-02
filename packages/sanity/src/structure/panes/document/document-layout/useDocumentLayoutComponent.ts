import {type ComponentType} from 'react'
import {useMiddlewareComponents} from 'sanity'

import {DocumentLayout, type DocumentLayoutOptions} from './DocumentLayout'
import {pickDocumentLayoutComponent} from './pickDocumentLayoutComponent'

/**
 * A hook that returns the document layout composed
 * by the Components API (`document.components.layout`).
 */
export function useDocumentLayoutComponent(): ComponentType<DocumentLayoutOptions> {
  return useMiddlewareComponents<DocumentLayoutOptions>({
    pick: pickDocumentLayoutComponent,
    defaultComponent: DocumentLayout,
  })
}

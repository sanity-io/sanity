import {type ComponentType} from 'react'
import {type DocumentLayoutProps, useMiddlewareComponents} from 'sanity'

import {DocumentLayout} from './DocumentLayout'
import {pickDocumentLayoutComponent} from './pickDocumentLayoutComponent'

/**
 * A hook that returns the document layout composed
 * by the Components API (`document.components.layout`).
 */
export function useDocumentLayoutComponent(): ComponentType<
  Omit<DocumentLayoutProps, 'renderDefault'>
> {
  return useMiddlewareComponents({
    pick: pickDocumentLayoutComponent,
    defaultComponent: DocumentLayout,
  })
}

import {type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../../../core/config/components/useMiddlewareComponents'
import {type DocumentLayoutProps} from '../../../../core/config/types'
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

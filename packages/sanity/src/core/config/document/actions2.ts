import {SanityClient, SanityDocument} from '@sanity/client'
import {ButtonTone} from '@sanity/ui'
import {DocumentStore, OperationsAPI} from '../../store'
import {ComponentType} from 'react'

export interface ComponentMenuItem {
  title: string
  icon?: React.ComponentType | React.ReactNode
  disabled?: boolean
  tone?: ButtonTone
}
export interface HooMenuItem {
  title: string
  icon?: React.ComponentType | React.ReactNode
  disabled?: boolean
  tone?: ButtonTone
  onClick?: () => void
}

interface BaseContext {
  draft: SanityDocument | null
  published: SanityDocument | null
  id: string
  type: string
}

interface MenuItemContext extends BaseContext {
  loading: boolean
}

interface OnActionContext extends BaseContext {
  client: SanityClient
  operations: OperationsAPI
  documentStore: DocumentStore
  onActionStart: () => void
  onActionEnd: () => void
}

type BaseOnAction = () => void
type BaseOnActionPromise = (context: OnActionContext) => void

export interface DocumentActionUseProps {
  documentId: string
  documentType: string
  draft: SanityDocument | null
  published: SanityDocument | null
}

export type DocumentActionWithComponent = {
  name: string
  context?: 'default' | 'menu'
  menuItem?: ComponentMenuItem
  // A promise that receices parameters
  onAction?: BaseOnActionPromise | BaseOnAction
  view: {
    component: ComponentType<any>
    type: 'dialog' | 'popover' | 'inspector'
  }
}

export type DocumentActionWithHook = {
  name: string
  context?: 'default' | 'menu'
  // React hook that returns a menu item
  use: (props: DocumentActionUseProps) => HooMenuItem
}

export type DocumentAction2 = DocumentActionWithComponent | DocumentActionWithHook

export const defineDocumentAction = (action: DocumentAction2): DocumentAction2 => action

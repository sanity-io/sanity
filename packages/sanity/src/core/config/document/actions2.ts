import {SanityClient, SanityDocument} from '@sanity/client'
import {ButtonTone} from '@sanity/ui'
import {DocumentStore, OperationsAPI} from '../../store'

interface BaseMenuItem {
  title: string
  icon?: React.ComponentType | React.ReactNode
  disabled?: boolean
  tone?: ButtonTone
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

export type DocumentAction2 = {
  name: string
  context?: 'default' | 'menu'
  menuItem: BaseMenuItem | ((context: MenuItemContext) => BaseMenuItem)
  // A promise that receices parameters
  onAction: BaseOnActionPromise | BaseOnAction
}

export const defineDocumentAction = (action: DocumentAction2): DocumentAction2 => action

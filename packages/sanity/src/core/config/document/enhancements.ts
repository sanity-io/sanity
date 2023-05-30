import {ButtonTone} from '@sanity/ui'

export interface DocumentEnhancementMenuItem {
  disabled?: boolean
  icon?: React.ComponentType | React.ReactNode
  title: string
  tone?: ButtonTone
}

export interface DocumentEnhancementHookDefinition extends DocumentEnhancementMenuItem {
  onClick?: () => void
}

export interface BaseDocumentEnhancementProps {
  name: string
  context?: 'default' | 'menu'
}

export interface DocumentEnhancementProps extends BaseDocumentEnhancementProps {
  menuItem: DocumentEnhancementMenuItem
  view: {
    component: React.ComponentType<any>
    type: 'dialog' | 'popover' | 'inspector'
  }
}

export interface DocumentEnhancementHookContext {
  documentId: string
  documentType: string
}

export interface DocumentEnhancementHookProps extends BaseDocumentEnhancementProps {
  use: (context: DocumentEnhancementHookContext) => DocumentEnhancementHookDefinition
}

export type DocumentEnhancement = DocumentEnhancementProps | DocumentEnhancementHookProps

export const defineDocumentEnhancement = (action: DocumentEnhancement): DocumentEnhancement =>
  action

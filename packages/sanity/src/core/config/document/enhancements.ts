import {ButtonTone} from '@sanity/ui'

/** @beta */
export interface DocumentEnhancementMenuItem {
  disabled?: boolean
  icon?: React.ComponentType | React.ReactNode
  title: string
  tone?: ButtonTone
}

/** @beta */
export interface DocumentEnhancementHookDefinition extends DocumentEnhancementMenuItem {
  onClick?: () => void
}

/** @beta */
export interface BaseDocumentEnhancement {
  name: string
  context?: 'default' | 'menu'
}

/** @beta */
export interface DocumentEnhancementProps extends BaseDocumentEnhancement {
  menuItem: DocumentEnhancementMenuItem
  view: {
    component: React.ComponentType<any>
    type: 'dialog' | 'popover' | 'inspector'
  }
}

/** @beta */
export interface DocumentEnhancementHookContext {
  documentId: string
  documentType: string
}

/** @beta */
export interface DocumentEnhancementHookProps extends BaseDocumentEnhancement {
  use: (context: DocumentEnhancementHookContext) => DocumentEnhancementHookDefinition
}

/** @beta */
export type DocumentEnhancement = DocumentEnhancementProps | DocumentEnhancementHookProps

/** @beta */
export const defineDocumentEnhancement = (action: DocumentEnhancement): DocumentEnhancement =>
  action

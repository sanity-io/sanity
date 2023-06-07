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
  useMenuItem: (context: DocumentEnhancementHookContext) => DocumentEnhancementHookDefinition
  name: string
  context?: 'default' | 'menu'
}

/** @beta */
export interface DocumentEnhancementProps extends BaseDocumentEnhancement {
  view: {
    component: React.ComponentType<{onClose: () => void}>
    type: 'dialog' | 'popover' | 'inspector'
  }
}

/** @beta */
export interface DocumentEnhancementHookContext {
  documentId: string
  documentType: string
  onOpen: () => void
  onClose: () => void
  isOpen: boolean
}

/** @beta */
export interface DocumentEnhancementHookProps extends BaseDocumentEnhancement {
  view?: {
    component: React.ComponentType<{onClose: () => void}>
    type: 'dialog' | 'popover' | 'inspector'
  }
}

/** @beta */
export type DocumentEnhancement = DocumentEnhancementProps | DocumentEnhancementHookProps

/** @beta */
export const defineDocumentEnhancement = (action: DocumentEnhancement): DocumentEnhancement =>
  action

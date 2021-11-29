import type {SanityDocument} from '@sanity/types'
import type React from 'react'

export type LegacyDocumentActionColor = 'primary' | 'success' | 'warning' | 'danger'

export interface ActionComponent<ActionProps> {
  (props: ActionProps): DocumentActionDescription | null
}

export interface DocumentActionProps {
  id: string
  type: string
  draft: SanityDocument | null
  liveEdit: boolean
  published: SanityDocument | null
  revision: string
  onComplete: () => void
}

export type DocumentActionComponent = ActionComponent<DocumentActionProps>

// Rename to `portal`?
export interface DocumentActionLegacyDialogProps {
  type: 'legacy'
  content: React.ReactNode
}

export interface DocumentActionConfirmDialogProps {
  type: 'confirm'
  color?: 'success' | 'warning' | 'danger' | 'info'
  message: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
  cancelButtonIcon?: React.ComponentType | React.ReactNode
  cancelButtonText?: React.ReactNode
  confirmButtonIcon?: React.ComponentType | React.ReactNode
  confirmButtonText?: React.ReactNode
}

export interface DocumentActionModalDialogProps {
  type: 'modal'
  content: React.ReactNode
  /**
   * @beta
   */
  footer?: React.ReactNode
  /**
   * @beta
   */
  header?: React.ReactNode
  onClose: () => void
  showCloseButton?: boolean
  /**
   * @beta
   */
  width?: 'small' | 'medium' | 'large' | 'full'
}

export interface DocumentActionPopoverDialogProps {
  type: 'popover'
  content: React.ReactNode
  onClose: () => void
}

/**
 * @deprecated
 */
export interface DocumentActionErrorDialogProps {
  type: 'error'
  content?: React.ReactNode
  onClose: () => void
  title?: React.ReactNode
}

/**
 * @deprecated
 */
export interface DocumentActionSuccessDialogProps {
  type: 'success'
  content?: React.ReactNode
  onClose: () => void
  title?: React.ReactNode
}

export type DocumentActionDialogProps =
  | DocumentActionLegacyDialogProps
  | DocumentActionConfirmDialogProps
  | DocumentActionPopoverDialogProps
  | DocumentActionModalDialogProps
  | DocumentActionErrorDialogProps
  | DocumentActionSuccessDialogProps

export interface DocumentActionDescription {
  color?: LegacyDocumentActionColor
  dialog?: DocumentActionDialogProps | false | null
  disabled?: boolean
  icon?: React.ReactNode | React.ComponentType
  label: string
  onHandle?: () => void
  shortcut?: string | null
  title?: React.ReactNode
}

import {SanityDocument} from '@sanity/types'
import React from 'react'

export interface ActionComponent<ActionProps> {
  (props: ActionProps): ActionDescription | null
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

export interface DocumentActionLegacyDialogProps {
  type: 'legacy'
  content: React.ReactNode
}

export interface DocumentActionConfirmDialogProps {
  type: 'confirm'
  color?: 'warning' | 'success' | 'danger' | 'info'
  message: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
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

export interface ActionDescription {
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  shortcut?: string | null
  title?: React.ReactNode
  dialog?: DocumentActionDialogProps | false | null
  onHandle?: () => void
}

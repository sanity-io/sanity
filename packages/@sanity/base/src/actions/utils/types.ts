import {ButtonTone} from '@sanity/ui'
import React from 'react'
import {EditStateFor} from '../../datastores/document/document-pair/editState'

export type ActionHook<T, K> = (args: T) => K | null

export interface ActionComponent<ActionProps> {
  (props: ActionProps): DocumentActionDescription | null
}

export interface DocumentActionProps extends EditStateFor {
  revision?: string
  onComplete: () => void
}

export type DocumentActionComponent = ActionComponent<DocumentActionProps>

export interface DocumentActionResolver {
  (props: EditStateFor): DocumentActionComponent[]
}

export interface DocumentActionConfirmModalProps {
  type: 'confirm'
  tone?: ButtonTone
  message: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
  cancelButtonIcon?: React.ComponentType | React.ReactNode
  cancelButtonText?: React.ReactNode
  confirmButtonIcon?: React.ComponentType | React.ReactNode
  confirmButtonText?: React.ReactNode
}

export interface DocumentActionDialogModalProps {
  type: 'dialog'
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

export interface DocumentActionPopoverModalProps {
  type: 'popover'
  content: React.ReactNode
  onClose: () => void
}

export type DocumentActionModalProps =
  | DocumentActionConfirmModalProps
  | DocumentActionPopoverModalProps
  | DocumentActionDialogModalProps

export interface DocumentActionDescription {
  tone?: ButtonTone
  modal?: DocumentActionModalProps | false | null
  disabled?: boolean
  icon?: React.ReactNode | React.ComponentType
  label: string
  onHandle?: () => void
  shortcut?: string | null
  title?: React.ReactNode
}

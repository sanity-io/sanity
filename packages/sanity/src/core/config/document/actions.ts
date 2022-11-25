import {type ButtonTone} from '@sanity/ui'
import type React from 'react'
import {type EditStateFor} from '../../store/_legacy'

/** @beta */
export interface ActionComponent<ActionProps> {
  (props: ActionProps): DocumentActionDescription | null
}

/** @beta */
export interface DocumentActionProps extends EditStateFor {
  revision?: string
  onComplete: () => void
}

/** @beta */
export interface DocumentActionComponent extends ActionComponent<DocumentActionProps> {
  /**
   * An optional meta property that can used to replace this document action
   * with another. E.g.:
   *
   * ```js
   * import {defineConfig} from 'sanity'
   * import {MyPublishAction} from '...'
   *
   * export default defineConfig({
   *   document: {
   *     actions: (prev) =>
   *       prev.map((previousAction) =>
   *         previousAction.action === 'publish' ? MyPublishAction : previousAction
   *       ),
   *   },
   * })
   * ```
   */
  action?: 'delete' | 'discardChanges' | 'duplicate' | 'restore' | 'publish' | 'unpublish'
}

/** @beta */
export interface DocumentActionConfirmDialogProps {
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

/** @beta */
export interface DocumentActionModalDialogProps {
  type?: 'dialog'
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

/** @beta */
export interface DocumentActionPopoverDialogProps {
  type: 'popover'
  content: React.ReactNode
  onClose: () => void
}

/** @beta */
export type DocumentActionDialogProps =
  | DocumentActionConfirmDialogProps
  | DocumentActionPopoverDialogProps
  | DocumentActionModalDialogProps

/** @beta */
export interface DocumentActionDescription {
  tone?: ButtonTone
  dialog?: DocumentActionDialogProps | false | null
  disabled?: boolean
  icon?: React.ReactNode | React.ComponentType
  label: string
  onHandle?: () => void
  shortcut?: string | null
  title?: React.ReactNode
}

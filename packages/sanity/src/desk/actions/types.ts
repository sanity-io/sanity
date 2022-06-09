import type {ButtonTone} from '@sanity/ui'
import type React from 'react'
import type {EditStateFor} from '../../datastores'

export type ActionHook<T, K> = (args: T) => K | null

export interface ActionComponent<ActionProps> {
  (props: ActionProps): DocumentActionDescription | null
}

export interface DocumentActionProps extends EditStateFor {
  revision?: string
  onComplete: () => void
}

export interface DocumentActionComponent extends ActionComponent<DocumentActionProps> {
  /**
   * An optional meta property that can used to replace this document action
   * with another. E.g.:
   *
   * ```js
   * import {createConfig} from 'sanity'
   * import {MyPublishAction} from '...'
   *
   * export default createConfig({
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

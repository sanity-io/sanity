import {
  type ButtonTone,
  type DialogProps, // eslint-disable-line no-restricted-imports
} from '@sanity/ui'
import {type ComponentType, type ReactNode} from 'react'

import {type EditStateFor} from '../../store/_legacy'

/**
 * @hidden
 * @beta */
export interface ActionComponent<ActionProps> {
  (props: ActionProps): DocumentActionDescription | null
}

/**
 * @hidden
 * @beta */
export interface DocumentActionProps extends EditStateFor {
  revision?: string
  onComplete: () => void
}

/**
 * @hidden
 * @beta */
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
  /**
   * For debugging purposes
   */
  displayName?: string
}

/**
 * @hidden
 * @beta */
export interface DocumentActionConfirmDialogProps {
  type: 'confirm'
  tone?: ButtonTone
  message: ReactNode
  onConfirm: () => void
  onCancel: () => void
  cancelButtonIcon?: ComponentType | ReactNode
  cancelButtonText?: string
  confirmButtonIcon?: ComponentType | ReactNode
  confirmButtonText?: string
}

/**
 * @hidden
 * @beta */
export interface DocumentActionModalDialogProps {
  type?: 'dialog'
  content: ReactNode
  /**
   *
   * @hidden
   * @beta
   */
  footer?: DialogProps['footer']
  /**
   *
   * @hidden
   * @beta
   */
  header?: ReactNode
  onClose: () => void
  showCloseButton?: boolean
  /**
   *
   * @hidden
   * @beta
   */
  width?: 'small' | 'medium' | 'large' | 'full'
}

/**
 * @hidden
 * @beta */
export interface DocumentActionPopoverDialogProps {
  type: 'popover'
  content: ReactNode
  onClose: () => void
}

/**
 * @hidden
 * @beta */
export interface DocumentActionCustomDialogComponentProps {
  type: 'custom'
  component: ReactNode
}

/**
 * @hidden
 * @beta */
export type DocumentActionDialogProps =
  | DocumentActionConfirmDialogProps
  | DocumentActionPopoverDialogProps
  | DocumentActionModalDialogProps
  | DocumentActionCustomDialogComponentProps

/**
 * @hidden
 * @beta */
export type DocumentActionGroup = 'default' | 'paneActions'

/**
 * @hidden
 * @beta */
export interface DocumentActionDescription {
  tone?: ButtonTone
  dialog?: DocumentActionDialogProps | false | null
  disabled?: boolean
  icon?: ReactNode | ComponentType
  label: string
  onHandle?: () => void
  shortcut?: string | null
  title?: ReactNode
  /**
   * @beta
   */
  group?: DocumentActionGroup[]
}

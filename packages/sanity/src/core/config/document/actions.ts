import {
  type ButtonTone,
  type DialogProps, // eslint-disable-line no-restricted-imports
} from '@sanity/ui'
import {type ComponentType, type ReactNode} from 'react'

import {type EditStateFor, type MapDocument} from '../../store'
import {type ActionComponent, type GroupableActionDescription} from '../types'

/**
 * @hidden
 * @beta */
export interface DocumentActionProps extends EditStateFor {
  revision?: string
  /**
   * @deprecated - do not use, will be removed in a future major version, use local state instead, for example call `setDialogOpen(false)` in dialog's `onCancel` callback.
   */
  onComplete: () => void
  /**
   * Whether the initial value has been resolved.
   */
  initialValueResolved: boolean
}

const SANITY_DEFINED_ACTIONS = {
  delete: 'delete',
  discardChanges: 'discardChanges',
  discardVersion: 'discardVersion',
  duplicate: 'duplicate',
  restore: 'restore',
  publish: 'publish',
  unpublish: 'unpublish',
  unpublishVersion: 'unpublishVersion',
  linkToCanvas: 'linkToCanvas',
  editInCanvas: 'editInCanvas',
  unlinkFromCanvas: 'unlinkFromCanvas',
  schedule: 'schedule',
}

/**
 * Union of action identifiers built into Sanity. Use for exhaustive matching
 * over built-in actions.
 *
 * @public
 */
export type SanityDefinedAction = keyof typeof SANITY_DEFINED_ACTIONS

/**
 * Registry of document action keys. Extend via declaration merging to
 * register a custom action key. Use `never` as the value type; the values
 * are unused, and indexed access (`DocumentActionKeys[K]`) is not part of
 * the public contract.
 *
 * ```ts
 * declare module 'sanity' {
 *   interface DocumentActionKeys {
 *     myPlugin: never
 *   }
 * }
 * ```
 *
 * Once registered, `MyAction.action = 'myPlugin'` type-checks, and other
 * plugins can target the action for replacement.
 *
 * To match only Sanity-defined actions exhaustively, narrow with
 * `isSanityDefinedAction`.
 *
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- empty by design; extended via declaration merging
export interface DocumentActionKeys extends Record<SanityDefinedAction, never> {}

/**
 * Narrow an action's identifier to {@link SanityDefinedAction}. Use to
 * exhaustively match built-in actions in projects where plugins have
 * registered additional keys.
 *
 * @param action - The action to check.
 * @returns `true` if the action identifier is Sanity-defined.
 *
 * @public
 */
export const isSanityDefinedAction = (
  action: DocumentActionDescription & {action?: keyof DocumentActionKeys},
): action is DocumentActionDescription & {action: SanityDefinedAction} => {
  if (!action.action) return false
  return action.action in SANITY_DEFINED_ACTIONS
}

/**
 * @hidden
 * @beta */
export interface DocumentActionComponent extends ActionComponent<
  DocumentActionProps,
  DocumentActionDescription
> {
  /**
   * Stable identifier for this action. Set to a {@link SanityDefinedAction}
   * to replace a built-in, or to a key registered on
   * {@link DocumentActionKeys} via declaration merging so other plugins can
   * target the action for replacement.
   *
   * ```ts
   * import {defineConfig} from 'sanity'
   * import {MyPublishAction} from '...'
   *
   * export default defineConfig({
   *   document: {
   *     actions: (prev) =>
   *       prev.map((previousAction) =>
   *         previousAction.action === 'publish' ? MyPublishAction : previousAction,
   *       ),
   *   },
   * })
   * ```
   */
  action?: keyof DocumentActionKeys
  /**
   * For debugging purposes
   */
  displayName?: string
}

/**
 * @hidden
 * @beta
 */
export interface DuplicateActionProps extends DocumentActionProps {
  mapDocument?: MapDocument
}

/**
 * @hidden
 * @beta
 */
export interface DuplicateDocumentActionComponent
  extends
    ActionComponent<DuplicateActionProps, DocumentActionDescription>,
    Pick<DocumentActionComponent, 'action' | 'displayName'> {}

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
 * @beta
 */
export interface DocumentActionDescription extends GroupableActionDescription<DocumentActionGroup> {
  dialog?: DocumentActionDialogProps | false | null
}

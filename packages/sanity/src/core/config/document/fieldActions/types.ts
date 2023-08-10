import {Path, SchemaType} from '@sanity/types'
import {ComponentType, ReactNode} from 'react'
import {ComposableOption, ConfigContext} from '../../types'

/**
 * @hidden
 * @beta */
export interface DocumentFieldAction {
  name: string
  useAction: DocumentFieldActionHook
}

/**
 * @hidden
 * @beta */
export interface DocumentFieldActionHook {
  (props: DocumentFieldActionProps): DocumentFieldActionItem | DocumentFieldActionGroup
}

/**
 * @hidden
 * @beta */
export interface DocumentFieldActionProps {
  documentId: string
  documentType: string
  path: Path
  schemaType: SchemaType
}

/**
 * @hidden
 * @beta */
export type DocumentFieldActionStatus = 'info' | 'success' | 'warning' | 'error'

/**
 * @hidden
 * @beta */
export type DocumentFieldActionTone = 'primary' | 'positive' | 'caution' | 'critical'

/**
 * @hidden
 * @beta */
export interface DocumentFieldActionItem {
  type: 'action'
  disabled?: boolean | {reason: ReactNode}
  hidden?: boolean
  icon?: ComponentType
  iconRight?: ComponentType
  onAction: () => void
  renderAsButton?: boolean
  selected?: boolean
  status?: DocumentFieldActionStatus
  title: string
  tone?: DocumentFieldActionTone
}

/**
 * @hidden
 * @beta */
export interface DocumentFieldActionDivider {
  type: 'divider'
}

/**
 * @hidden
 * @beta */
export interface DocumentFieldActionGroup {
  type: 'group'
  children: DocumentFieldActionNode[]
  disabled?: boolean | {reason: ReactNode}
  expanded?: boolean
  hidden?: boolean
  icon?: ComponentType
  renderAsButton?: boolean
  status?: DocumentFieldActionStatus
  title: string
  tone?: DocumentFieldActionTone
}

/**
 * @hidden
 * @beta */
export type DocumentFieldActionNode =
  | DocumentFieldActionItem
  | DocumentFieldActionGroup
  | DocumentFieldActionDivider

/**
 * @hidden
 * @beta */
export interface DocumentFieldActionsResolverContext extends ConfigContext {
  documentId: string
  documentType: string
  schemaType: SchemaType
}

/**
 * @hidden
 * @beta */
export type DocumentFieldActionsResolver = ComposableOption<
  DocumentFieldAction[],
  DocumentFieldActionsResolverContext
>

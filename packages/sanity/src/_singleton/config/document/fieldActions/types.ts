import {type I18nTextRecord} from '@sanity/types'
import {type ComponentType, type ReactNode} from 'react'

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
  i18n?: I18nTextRecord<'title'>
  tone?: DocumentFieldActionTone
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
  i18n?: I18nTextRecord<'title'>
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
export type DocumentFieldActionNode =
  | DocumentFieldActionItem
  | DocumentFieldActionGroup
  | DocumentFieldActionDivider

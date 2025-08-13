import {type ComponentType, type ReactNode} from 'react'

import type {HookCollectionActionHook} from '../../components/hookCollection/types'
import type {EditStateFor} from '../../store/_legacy/document/document-pair/editState'

/**
 * @hidden
 * @beta */
export interface DocumentBadgeDescription {
  title?: string
  label?: string | undefined
  color?: 'primary' | 'success' | 'warning' | 'danger'
  icon?: ReactNode | ComponentType
}

/**
 * @hidden
 * @beta */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DocumentBadgeProps extends EditStateFor {}

/**
 * @hidden
 * @beta */
export interface DocumentBadgeComponent
  extends HookCollectionActionHook<DocumentBadgeProps, DocumentBadgeDescription> {
  (props: DocumentBadgeProps): DocumentBadgeDescription | null
}

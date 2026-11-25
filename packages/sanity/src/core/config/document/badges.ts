import {type ComponentType, type ReactNode} from 'react'

import {type EditStateFor} from '../../store/document/document-pair/editState'

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
export interface DocumentBadgeProps extends EditStateFor {}

/**
 * @hidden
 * @beta */
export interface DocumentBadgeComponent {
  (props: DocumentBadgeProps): DocumentBadgeDescription | null
  displayName?: string | undefined
  action?: string
}

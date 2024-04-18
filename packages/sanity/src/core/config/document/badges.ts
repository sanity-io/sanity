import {type ComponentType, type ReactNode} from 'react'

import {type EditState} from '../../store'

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
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DocumentBadgeProps extends EditState {}

/**
 * @hidden
 * @beta */
export interface DocumentBadgeComponent {
  (props: DocumentBadgeProps): DocumentBadgeDescription | null
}

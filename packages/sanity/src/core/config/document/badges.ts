import {type ComponentType, type ReactNode} from 'react'

import {type HookCollectionActionHook} from '../../components/hookCollection'
import {type EditStateFor} from '../../store'

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
export interface DocumentBadgeProps extends EditStateFor {
  type: string
  /**
   * Whether live edit is enabled. This may be true for various reasons:
   *
   * - The schema type has live edit enabled.
   * - A version of the document is checked out.
   */
  liveEdit: boolean
  /**
   * Whether the schema type has live edit enabled.
   */
  liveEditSchemaType: boolean
}

/**
 * @hidden
 * @beta */
export interface DocumentBadgeComponent extends HookCollectionActionHook<
  DocumentBadgeProps,
  DocumentBadgeDescription
> {
  (props: DocumentBadgeProps): DocumentBadgeDescription | null
}

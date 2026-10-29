import {type ReleaseDocument} from '@sanity/client'
import {type ComponentType, type ReactNode} from 'react'

import {type DocumentInRelease} from '../../releases/tool/detail/types'
import {type ConfigContext} from '../types'

/**
 * @public
 */
export interface ReleaseActionProps {
  release: ReleaseDocument
  documents: DocumentInRelease[]
}

/**
 * @hidden
 * @public
 */
export interface ReleaseActionComponent {
  (props: ReleaseActionProps): ReleaseActionDescription
  displayName?: string
}

/**
 * @hidden
 * @public
 */
export interface ReleaseActionDescription {
  disabled?: boolean
  icon?: ReactNode | ComponentType
  label: string
  onHandle?: () => void
  title?: ReactNode
  /**
   * Semantic tone for the action's menu item, so destructive or cautionary custom actions can read
   * as such (e.g. a delete-like action in `critical`). Defaults to `default` when omitted.
   */
  tone?: 'default' | 'primary' | 'positive' | 'caution' | 'critical'
}

/**
 * @hidden
 * @public
 */
export type ReleaseActionsContext = ConfigContext & ReleaseActionProps

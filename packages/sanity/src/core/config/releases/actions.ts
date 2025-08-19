import {type ReleaseDocument} from '@sanity/client'
import {type ComponentType, type ReactNode} from 'react'

import {type DocumentInRelease} from '../../releases/tool/detail/useBundleDocuments'
import {type ConfigContext} from '../types'

/**
 * @internal
 */
interface ActionComponent<ActionProps> {
  (props: ActionProps): ReleaseActionDescription | null
}

/**
 * @hidden
 * @beta
 */
export interface ReleaseActionProps {
  release: ReleaseDocument
  // documents in the release
  documents: DocumentInRelease[]
}

/**
 * @hidden
 * @beta
 */
export interface ReleaseActionComponent extends ActionComponent<ReleaseActionProps> {
  displayName?: string
}

/**
 * @hidden
 */
export type ReleaseActionGroup = 'default' | 'list' | 'detail'

/**
 * @hidden
 * @beta
 */
export interface ReleaseActionDescription {
  disabled?: boolean
  icon?: ReactNode | ComponentType
  label: string
  onHandle?: () => void
  title?: ReactNode
  group?: ReleaseActionGroup[]
}

/**
 * @hidden
 * @beta
 */
export type ReleaseActionsContext = ConfigContext & ReleaseActionProps

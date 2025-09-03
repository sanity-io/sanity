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
export interface ReleaseActionComponent extends ActionComponent<ReleaseActionProps> {
  displayName?: string
}

/**
 * @hidden
 * @internal
 */
export interface ReleaseActionDescription {
  disabled?: boolean
  icon?: ReactNode | ComponentType
  label: string
  onHandle?: () => void
  title?: ReactNode
}

/**
 * @hidden
 * @public
 */
export type ReleaseActionsContext = ConfigContext & ReleaseActionProps

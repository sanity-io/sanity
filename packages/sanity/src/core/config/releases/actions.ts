import {type ReleaseDocument} from '@sanity/client'
import {type ComponentType, type ReactNode} from 'react'

import {type DocumentInRelease} from '../../releases/tool/detail/useBundleDocuments'
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
}

/**
 * @hidden
 * @public
 */
export type ReleaseActionsContext = ConfigContext & ReleaseActionProps

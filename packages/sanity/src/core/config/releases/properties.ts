import {type ComponentType} from 'react'

import {type DocumentInRelease} from '../../releases/tool/detail/types'
import {type ConfigContext} from '../types'
import {type ReleaseDetailProps} from './detail'

/**
 * @beta
 */
export interface ReleasePropertyProps {
  release: ReleaseDetailProps['release']
  documents: DocumentInRelease[]
}

/**
 * One row in the properties of the release detail page.
 *
 * @beta
 */
export interface ReleasePropertyDescription {
  label: string
  /** One line of text. A longer value is truncated, with the full text in the tooltip. */
  value: string
  /** A `@sanity/icons` component, sized like the built-in property glyphs. */
  icon?: ComponentType
  /** Colours the value. */
  tone?: 'positive' | 'caution' | 'critical'
  /** Makes the value a link. */
  href?: string
  /** Defaults to the full value. */
  tooltip?: string
}

/**
 * Called as a hook by Studio. Return `null` to hide the row.
 *
 * @beta
 */
export interface ReleasePropertyComponent {
  (props: ReleasePropertyProps): ReleasePropertyDescription | null
  /** Set on Studio's default rows to the name of the metadata field they show. */
  field?: string
  displayName?: string
}

/**
 * @beta
 */
export type ReleasePropertiesContext = ConfigContext & ReleasePropertyProps

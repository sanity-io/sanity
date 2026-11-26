import {type DatasetsResponse, type SanityClient} from '@sanity/client'
import {type ComponentType} from 'react'

export interface VisionProps {
  client: SanityClient
  config: VisionConfig
}

/**
 * Beta features of the Vision tool.
 *
 * @beta
 */
export interface VisionBetaConfig {
  /**
   * @deprecated Remove this option: this version of Vision is the classic tool only. The
   * redesigned Vision ships in the stable `@sanity/vision@^7` release, where it needs no option.
   */
  redesign?: never
}

export interface VisionConfig {
  datasets?: string[] | ((datasets: DatasetsResponse) => DatasetsResponse)
  defaultApiVersion: string
  defaultDataset?: string
  /** @beta */
  beta?: VisionBetaConfig
}

export interface VisionToolConfig extends Partial<VisionConfig> {
  name?: string
  title?: string
  icon?: ComponentType
}

export type {VisionLocaleResourceKeys} from './i18n/resources'

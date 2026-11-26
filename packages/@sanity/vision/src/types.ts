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
   * Has no effect: Vision always shows the classic tool.
   *
   * @deprecated Has no effect and can be removed from the config.
   */
  redesign?: {
    enabled?: boolean
  }
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

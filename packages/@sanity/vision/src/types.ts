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
   * The redesigned Vision experience: query tabs, a collapsible sidebar with saved and shared
   * queries, live refetching through sync tags, response details and export helpers.
   */
  redesign?: {
    /**
     * When `true`, the classic tool shows a dismissible toast inviting users to try the redesign,
     * and users who opt in get the redesigned tool (remembered per project in the browser). They
     * can switch back from the redesigned tool's sidebar or settings. Defaults to `false`.
     */
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

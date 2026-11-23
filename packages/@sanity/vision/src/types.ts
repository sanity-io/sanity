import {type DatasetsResponse, type SanityClient} from '@sanity/client'
import {type ComponentType} from 'react'

export interface VisionProps {
  client: SanityClient
  config: VisionConfig
}

/**
 * Vision's AI features, each switched on unless set to `false`. Each one writes with Sanity
 * Agent Actions and uses the organization's AI credits.
 */
export interface VisionAiFeatures {
  /** Generate: writes the tab's GROQ query from a description, with Agent Actions */
  generateQuery?: boolean
  /** Generate in the Mutate panel: writes mutations from a description, with Agent Actions */
  generateMutations?: boolean
  /**
   * "Explain this to me" in the Explain panel: describes the query and its plan in plain words,
   * with Agent Actions. The query plan itself stays available.
   */
  explainQuery?: boolean
}

/**
 * Which of Vision's AI features are on: `true` (the default) for all of them, `false` for none,
 * or an object that switches off the features set to `false` and leaves the rest on.
 *
 * @example
 * ```ts
 * visionTool({ai: false})
 * visionTool({ai: {generateQuery: false}})
 * ```
 */
export type VisionAiConfig = boolean | VisionAiFeatures

export interface VisionConfig {
  datasets?: string[] | ((datasets: DatasetsResponse) => DatasetsResponse)
  defaultApiVersion: string
  defaultDataset?: string
  /** Which AI features are on; all of them unless configured otherwise */
  ai?: VisionAiConfig
}

export interface VisionToolConfig extends Partial<VisionConfig> {
  name?: string
  title?: string
  icon?: ComponentType
}

export type {VisionLocaleResourceKeys} from './i18n/resources'

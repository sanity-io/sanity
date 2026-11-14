import {type DatasetsResponse, type SanityClient} from '@sanity/client'
import {type ComponentType} from 'react'

export interface VisionProps {
  client: SanityClient
  config: VisionConfig
}

export interface VisionConfig {
  datasets?: string[] | ((datasets: DatasetsResponse) => DatasetsResponse)
  defaultApiVersion: string
  defaultDataset?: string
}

export interface VisionToolConfig extends Partial<VisionConfig> {
  name?: string
  title?: string
  icon?: ComponentType
}

export type {VisionLocaleResourceKeys} from './i18n/resources'

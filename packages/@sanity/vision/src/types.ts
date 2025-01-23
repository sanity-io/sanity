import {type SanityClient} from '@sanity/client'
import {type ComponentType} from 'react'
import {type PerspectiveContextValue} from 'sanity'

export interface VisionProps {
  client: SanityClient
  config: VisionConfig
  pinnedPerspective: PerspectiveContextValue
}

export interface VisionConfig {
  defaultApiVersion: string
  defaultDataset?: string
}

export interface VisionToolConfig extends Partial<VisionConfig> {
  name?: string
  title?: string
  icon?: ComponentType
}

export type {VisionLocaleResourceKeys} from './i18n/resources'

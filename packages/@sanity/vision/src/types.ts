import type {SanityClient} from '@sanity/client'

export interface VisionProps {
  client: SanityClient
  config: VisionConfig
}

export interface VisionConfig {
  defaultApiVersion: string
  defaultDataset?: string
}

export interface VisionToolConfig extends Partial<VisionConfig> {
  name?: string
  title?: string
  icon?: React.ElementType
}

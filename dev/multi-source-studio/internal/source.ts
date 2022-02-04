import {SanitySourceConfig} from '@sanity/base'
import {schemaTypes} from './schema'

export const internalSource: SanitySourceConfig = {
  name: 'internal',
  title: 'Internal',
  projectId: 'ppsg7ml5',
  dataset: 'test-multi-source-internal',
  schemaTypes,
}

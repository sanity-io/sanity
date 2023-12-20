import type {ArraySchemaType} from '@sanity/types'
import type {BlockEnabledFeatures, DeserializerRule} from '../../types'
import createHTMLRules from './html'
import createGDocsRules from './gdocs'
import createWordRules from './word'
import createNotionRules from './notion'

export function createRules(
  blockContentType: ArraySchemaType,
  options: BlockEnabledFeatures,
): DeserializerRule[] {
  return [
    ...createWordRules(),
    ...createNotionRules(blockContentType),
    ...createGDocsRules(blockContentType, options),
    ...createHTMLRules(blockContentType, options),
  ]
}

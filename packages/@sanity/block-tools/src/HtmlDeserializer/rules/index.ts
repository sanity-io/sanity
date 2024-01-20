import {type ArraySchemaType} from '@sanity/types'

import {type BlockEnabledFeatures, type DeserializerRule} from '../../types'
import createGDocsRules from './gdocs'
import createHTMLRules from './html'
import createNotionRules from './notion'
import createWordRules from './word'

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

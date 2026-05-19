import {type PortableTextBlock} from '@sanity/types'

import {type SystemVariant} from '../types'
import {createMockVariant} from './createMockVariant'

function createDescription(text: string): PortableTextBlock[] {
  return [
    {
      _key: 'description',
      _type: 'block',
      children: [{_key: 'span', _type: 'span', marks: [], text}],
      markDefs: [],
      style: 'normal',
    },
  ]
}

export const variantAlphaAudience: SystemVariant = {
  ...createMockVariant('alpha-audience', 2),
  conditions: {audience: 'alpha', locale: 'en-US'},
  metadata: {
    title: 'Alpha audience',
    description: [],
  },
}

export const variantNorwegianMarket: SystemVariant = {
  ...createMockVariant('norwegian-market', 1),
  conditions: {locale: 'nb-NO', market: 'nordics'},
  metadata: {
    title: 'Norwegian market',
    description: [],
  },
}

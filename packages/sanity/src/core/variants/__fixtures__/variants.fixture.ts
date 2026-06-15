import {type SystemVariant} from '../types'
import {createMockVariant} from './createMockVariant'

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

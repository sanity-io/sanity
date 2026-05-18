import {createVariant} from '../store/__tests__/testUtils'
import {type SystemVariant} from '../types'

export const variantAlphaAudience: SystemVariant = {
  ...createVariant('alpha-audience', 2),
  conditions: {audience: 'alpha', locale: 'en-US'},
  metadata: {
    title: 'Alpha audience',
    description: [],
  },
}

export const variantNorwegianMarket: SystemVariant = {
  ...createVariant('norwegian-market', 1),
  conditions: {locale: 'nb-NO', market: 'nordics'},
  metadata: {
    title: 'Norwegian market',
    description: [],
  },
}

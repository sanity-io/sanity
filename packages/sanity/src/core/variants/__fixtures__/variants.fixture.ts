import {type StoredSystemVariant, type SystemVariant} from '../types'
import {createMockVariant} from './createMockVariant'

export const variantAlphaAudience: SystemVariant = {
  ...createMockVariant('alpha-audience', 2),
  conditions: [
    {_key: 'audience', condition: 'audience', value: 'alpha'},
    {_key: 'locale', condition: 'locale', value: 'en-US'},
  ],
  metadata: {
    title: 'Alpha audience',
    description: [],
  },
}

export const variantNorwegianMarket: SystemVariant = {
  ...createMockVariant('norwegian-market', 1),
  conditions: [
    {_key: 'locale', condition: 'locale', value: 'nb-NO'},
    {_key: 'market', condition: 'market', value: 'nordics'},
  ],
  metadata: {
    title: 'Norwegian market',
    description: [],
  },
}

/** A definition still stored in the legacy object shape, as Content Lake returns it. */
export const legacyVariantAlphaAudience: StoredSystemVariant = {
  ...createMockVariant('legacy-alpha-audience', 3),
  conditions: {audience: 'alpha', locale: 'en-US'},
  metadata: {
    title: 'Legacy alpha audience',
    description: [],
  },
}

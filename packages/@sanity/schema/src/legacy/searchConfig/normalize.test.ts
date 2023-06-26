import {normalizeUserSearchConfigs} from './normalize'

describe('searchConfig.normalize', () => {
  describe('normalizeSearchConfigs', () => {
    it('should keep numbers as numbers in path segments', () => {
      const normalized = normalizeUserSearchConfigs([
        {weight: 10, path: ['retain', 0, 'numbers']},
        {weight: 1, path: 'with.0.number'},
        {path: 'missing.weight'},
        {weight: 2, path: ['map', 'with'], mapWith: 'datetime'},
      ])

      expect(normalized).toEqual([
        {weight: 10, path: ['retain', 0, 'numbers'], mapWith: undefined, userProvided: true},
        {weight: 1, path: ['with', 0, 'number'], mapWith: undefined, userProvided: true},
        {weight: 1, path: ['missing', 'weight'], mapWith: undefined, userProvided: true},
        {weight: 2, path: ['map', 'with'], mapWith: 'datetime', userProvided: true},
      ])
    })
  })
})

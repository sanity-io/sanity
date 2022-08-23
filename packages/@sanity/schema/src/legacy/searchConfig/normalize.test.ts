import {normalizeSearchConfigs} from './normalize'

describe('searchConfig.normalize', () => {
  describe('normalizeSearchConfigs', () => {
    it('should keep numbers as numbers in path segments', () => {
      const normalized = normalizeSearchConfigs([
        {weight: 10, path: ['retain', 0, 'numbers']},
        {weight: 1, path: 'with.0.number'},
        {path: 'missing.weight'},
        {weight: 2, path: ['map', 'with'], mapWith: 'datetime'},
      ])

      expect(normalized).toEqual([
        {weight: 10, path: ['retain', 0, 'numbers'], mapWith: undefined},
        {weight: 1, path: ['with', 0, 'number'], mapWith: undefined},
        {weight: 1, path: ['missing', 'weight'], mapWith: undefined},
        {weight: 2, path: ['map', 'with'], mapWith: 'datetime'},
      ])
    })
  })
})

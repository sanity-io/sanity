import {deriveFromPreview} from './resolve'

describe('searchConfig.resolve', () => {
  describe('deriveFromPreview', () => {
    it('should split selected fields, and add default weights, keeping numbers as numbers', () => {
      const weightedPaths = deriveFromPreview({
        preview: {
          select: {
            title: 'cover.0.card.0.title',
            subtitle: 'singleField',
            description: 'nested.field',
            ignored: 'anyField',
          },
        },
      })

      expect(weightedPaths).toEqual([
        {weight: 10, path: ['cover', 0, 'card', 0, 'title']},
        {weight: 5, path: ['singleField']},
        {weight: 1.5, path: ['nested', 'field']},
      ])
    })
  })
})

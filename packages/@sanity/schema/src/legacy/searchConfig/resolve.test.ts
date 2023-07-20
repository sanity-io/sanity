import Schema from '../Schema'
import {
  deriveFromPreview,
  getCachedStringFieldPaths,
  pathCountSymbol,
  stringFieldsSymbol,
} from './resolve'

describe('searchConfig.resolve', () => {
  describe('getCachedStringFieldPaths', () => {
    const mockSchema = Schema.compile({
      name: 'default',
      types: [
        {
          name: 'objA',
          title: 'Circular Document A',
          type: 'document',
          fields: [
            {name: 'description', type: 'text'},
            {
              name: 'nested',
              type: 'object',
              fields: [
                {name: 'objA', type: 'objA'},
                {name: 'nestedTitle', type: 'string'},
              ],
            },
            {name: 'authors', type: 'array', of: [{type: 'string'}]},
            {name: 'objB', type: 'objB'},
            {name: 'objATitle', type: 'string'},
            {name: 'title', type: 'string'},
          ],
        },
        {
          name: 'objB',
          title: 'Circular Document B',
          type: 'document',
          fields: [
            {
              name: 'nested',
              type: 'object',
              fields: [
                {name: 'objB', type: 'objB'},
                {name: 'nestedTitle', type: 'string'},
              ],
            },
            {name: 'objA', type: 'objA'},
            {name: 'authors', type: 'array', of: [{type: 'string'}]},
            {name: 'title', type: 'string'},
            {name: 'description', type: 'text'},
            {name: 'objBTitle', type: 'string'},
          ],
        },
      ],
    })

    const objA = mockSchema.get('objA')
    // Clear cached values
    beforeEach(() => {
      delete objA[stringFieldsSymbol]
      delete objA[pathCountSymbol]
    })

    it('should always include _id and _type fields', () => {
      expect(getCachedStringFieldPaths(objA, 0, 10)).toEqual(
        expect.arrayContaining([
          {path: ['_id'], weight: 1},
          {path: ['_type'], weight: 1},
        ])
      )
    })

    it('should sort all other fields ahead of objects and arrays', () => {
      expect(getCachedStringFieldPaths(objA, 2, 100)).toEqual([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['title'], weight: 10},
        {path: ['description'], weight: 1},
        {path: ['objATitle'], weight: 1},
        //
        {path: ['authors', []], weight: 1},
        {path: ['nested', 'nestedTitle'], weight: 1},
        {path: ['objB', 'description'], weight: 1},
        {path: ['objB', 'objBTitle'], weight: 1},
        {path: ['objB', 'title'], weight: 1},
      ])
    })

    it('should limit on depth (1 level)', () => {
      expect(getCachedStringFieldPaths(objA, 1, 250)).toEqual([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['title'], weight: 10},
        {path: ['description'], weight: 1},
        {path: ['objATitle'], weight: 1},
      ])
    })

    it('should limit on depth (10 levels)', () => {
      const paths = getCachedStringFieldPaths(objA, 10, 5000)
      expect(paths).toEqual(
        expect.arrayContaining([
          // prettier-ignore
          { path: ['objB', 'objA', 'objB', 'objA', 'objB', 'objA', 'objB', 'objA', 'objB', 'title'], weight: 1 },
        ])
      )
      expect(paths).toEqual(
        expect.arrayContaining([
          // prettier-ignore
          { path: ['nested', 'objA', 'nested', 'objA', 'nested', 'objA', 'nested', 'objA', 'objB', 'title'], weight: 1 },
        ])
      )
    })

    it('should include all root-level non-object/array fields even when dealing with recursive structures', () => {
      expect(getCachedStringFieldPaths(objA, 500, 10)).toEqual(
        expect.arrayContaining([
          {path: ['_id'], weight: 1},
          {path: ['_type'], weight: 1},
          {path: ['description'], weight: 1},
          {path: ['objATitle'], weight: 1},
          {path: ['title'], weight: 10},
        ])
      )
    })

    it('should limit on the total number of search paths', () => {
      expect(getCachedStringFieldPaths(objA, 100, 250)).toHaveLength(250)
    })

    it('should cache field paths by type', () => {
      getCachedStringFieldPaths(objA, 100, 500)
      const paths = getCachedStringFieldPaths(objA, 1, 1)
      expect(paths).toHaveLength(500)
    })
  })

  describe('deriveFromPreview', () => {
    it('should split selected fields, and add default weights, keeping numbers as numbers', () => {
      const weightedPaths = deriveFromPreview({
        preview: {
          select: {
            title: 'cover.0.card.0.title',
            subtitle: 'singleField',
            description: 'nested.field',
            // @ts-expect-error test-specific: ignored isn't a valid key
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

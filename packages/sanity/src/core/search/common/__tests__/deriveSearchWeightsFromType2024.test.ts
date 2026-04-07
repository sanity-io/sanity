import {defineField, defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createSchema} from '../../../schema'
import {deriveSearchWeightsFromType2024} from '../deriveSearchWeightsFromType2024'

describe('deriveSearchWeightsFromType2024', () => {
  describe('reference fields in preview.select', () => {
    it('resolves reference paths in preview subtitle to GROQ dereference syntax', () => {
      const schema = createSchema({
        name: 'default',
        types: [
          defineType({
            name: 'author',
            type: 'document',
            fields: [defineField({name: 'name', type: 'string'})],
          }),
          defineType({
            name: 'book',
            type: 'document',
            preview: {
              select: {
                title: 'title',
                subtitle: 'author.name',
              },
            },
            fields: [
              defineField({name: 'title', type: 'string'}),
              defineField({
                name: 'author',
                type: 'reference',
                to: [{type: 'author'}],
              }),
            ],
          }),
        ],
      })

      const result = deriveSearchWeightsFromType2024({
        schemaType: schema.get('book')!,
        maxDepth: 5,
      })

      expect(result.paths).toContainEqual({path: 'title', weight: 10})
      expect(result.paths).toContainEqual({path: 'author->name', weight: 5})
    })

    it('resolves chained reference paths with multiple dereferences', () => {
      const schema = createSchema({
        name: 'default',
        types: [
          defineType({
            name: 'person',
            type: 'document',
            fields: [
              defineField({name: 'name', type: 'string'}),
              defineField({
                name: 'bestFriend',
                type: 'reference',
                to: [{type: 'person'}],
              }),
            ],
          }),
          defineType({
            name: 'book',
            type: 'document',
            preview: {
              select: {
                title: 'title',
                subtitle: 'author.bestFriend.name',
              },
            },
            fields: [
              defineField({name: 'title', type: 'string'}),
              defineField({
                name: 'author',
                type: 'reference',
                to: [{type: 'person'}],
              }),
            ],
          }),
        ],
      })

      const result = deriveSearchWeightsFromType2024({
        schemaType: schema.get('book')!,
        maxDepth: 5,
      })

      expect(result.paths).toContainEqual({path: 'author->bestFriend->name', weight: 5})
    })

    it('resolves reference paths when reference has multiple to types', () => {
      const schema = createSchema({
        name: 'default',
        types: [
          defineType({
            name: 'person',
            type: 'document',
            fields: [defineField({name: 'name', type: 'string'})],
          }),
          defineType({
            name: 'organization',
            type: 'document',
            fields: [defineField({name: 'name', type: 'string'})],
          }),
          defineType({
            name: 'project',
            type: 'document',
            preview: {
              select: {
                title: 'title',
                subtitle: 'owner.name',
              },
            },
            fields: [
              defineField({name: 'title', type: 'string'}),
              defineField({
                name: 'owner',
                type: 'reference',
                to: [{type: 'person'}, {type: 'organization'}],
              }),
            ],
          }),
        ],
      })

      const result = deriveSearchWeightsFromType2024({
        schemaType: schema.get('project')!,
        maxDepth: 5,
      })

      expect(result.paths).toContainEqual({path: 'owner->name', weight: 5})
    })

    it('silently ignores non-existent fields through references', () => {
      const schema = createSchema({
        name: 'default',
        types: [
          defineType({
            name: 'author',
            type: 'document',
            fields: [defineField({name: 'name', type: 'string'})],
          }),
          defineType({
            name: 'book',
            type: 'document',
            preview: {
              select: {
                title: 'title',
                subtitle: 'author.nonexistent',
              },
            },
            fields: [
              defineField({name: 'title', type: 'string'}),
              defineField({
                name: 'author',
                type: 'reference',
                to: [{type: 'author'}],
              }),
            ],
          }),
        ],
      })

      const result = deriveSearchWeightsFromType2024({
        schemaType: schema.get('book')!,
        maxDepth: 5,
      })

      expect(result.paths).toContainEqual({path: 'title', weight: 10})
      expect(result.paths).not.toContainEqual(
        expect.objectContaining({path: expect.stringContaining('nonexistent')}),
      )
    })
  })

  it('works for schemas that branch out a lot', () => {
    // schema of 60 "components" with 10 fields each
    const range = [...Array(60).keys()]

    const componentRefs = range.map((index) => ({type: `component_${index}`}))
    const components = range.map((index) =>
      defineType({
        name: `component_${index}`,
        type: 'object',
        fields: [
          ...[...Array(10).keys()].map((fieldIndex) =>
            defineField({name: `component_${index}_field_${fieldIndex}`, type: 'string'}),
          ),
          defineField({name: `children_${index}`, type: 'array', of: [...componentRefs]}),
        ],
      }),
    )

    const schema = createSchema({
      name: 'default',
      types: [
        ...components,
        defineType({
          name: 'testType',
          type: 'document',
          fields: [
            defineField({
              name: 'components',
              type: 'array',
              of: [...componentRefs],
            }),
          ],
        }),
      ],
    })

    expect(
      deriveSearchWeightsFromType2024({
        schemaType: schema.get('testType')!,
        maxDepth: 5,
      }),
    ).toMatchObject({
      typeName: 'testType',
    })
  })
})

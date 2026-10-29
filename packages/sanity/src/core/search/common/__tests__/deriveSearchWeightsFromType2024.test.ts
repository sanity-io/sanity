import {defineField, defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
import {deriveSearchWeightsFromType2024} from '../deriveSearchWeightsFromType2024'

describe('deriveSearchWeightsFromType2024', () => {
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

  describe('max depth', () => {
    const getSlugType = () =>
      createSchema({
        name: 'default',
        types: [
          defineType({
            name: 'slugDocument',
            type: 'document',
            preview: {select: {title: 'title', subtitle: 'slug.current'}},
            fields: [
              defineField({name: 'title', type: 'string'}),
              defineField({name: 'slug', type: 'slug'}),
              defineField({
                name: 'seo',
                type: 'object',
                fields: [defineField({name: 'description', type: 'string'})],
              }),
            ],
          }),
        ],
      }).get('slugDocument')!

    const getPaths = (spec: ReturnType<typeof deriveSearchWeightsFromType2024>) =>
      spec.paths.map(({path}) => path)

    it('counts the slug `current` field towards the depth', () => {
      const type = getSlugType()

      expect(getPaths(deriveSearchWeightsFromType2024({schemaType: type, maxDepth: 1}))).toEqual(
        expect.not.arrayContaining(['slug.current']),
      )
      expect(getPaths(deriveSearchWeightsFromType2024({schemaType: type, maxDepth: 2}))).toEqual(
        expect.arrayContaining(['title', 'slug.current']),
      )
    })

    it('derives the weights again when the same type is searched at a lower depth', () => {
      const type = getSlugType()

      expect(getPaths(deriveSearchWeightsFromType2024({schemaType: type, maxDepth: 5}))).toEqual(
        expect.arrayContaining(['seo.description', 'slug.current']),
      )
      expect(getPaths(deriveSearchWeightsFromType2024({schemaType: type, maxDepth: 1}))).toEqual(
        expect.not.arrayContaining(['seo.description', 'slug.current']),
      )
    })
  })
})

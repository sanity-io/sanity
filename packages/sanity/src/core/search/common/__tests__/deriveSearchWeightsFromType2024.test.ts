import {defineField, defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
import {deriveSearchWeightsFromType2024} from '../deriveSearchWeightsFromType2024'

describe(
  'deriveSearchWeightsFromType2024',
  () => {
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
  },
  {timeout: 10_000},
)

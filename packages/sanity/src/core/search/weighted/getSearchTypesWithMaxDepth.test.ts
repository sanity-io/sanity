import {Schema} from '@sanity/schema'
import {getSearchableTypes} from '../common/utils'
import {getSearchTypesWithMaxDepth} from './getSearchTypesWithMaxDepth'

const mockSchema = Schema.compile({
  name: 'default',
  types: [
    {name: 'book', title: 'Book', type: 'document', fields: [{name: 'title', type: 'string'}]},
    {
      name: 'nestedDocument',
      title: 'Nested document',
      type: 'document',
      fields: [
        {name: 'title', type: 'string'},
        {
          name: 'nestedObject',
          title: 'Nested object',
          type: 'object',
          fields: [
            {name: 'field1', type: 'string', description: 'This is a string field'},
            {name: 'field2', type: 'string', description: 'This is a collapsed field'},
            {
              name: 'field3',
              type: 'object',
              fields: [
                {name: 'nested1', title: 'nested1', type: 'string'},
                {
                  name: 'nested2',
                  title: 'nested2',
                  type: 'object',
                  fields: [
                    {
                      name: 'ge',
                      title: 'hello',
                      type: 'string',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

describe('getSearchTypesWithMaxDepth', () => {
  it('should limit searchable field depth to 5 levels by default if maxFieldDepth is not set', async () => {
    const searchableTypes = getSearchTypesWithMaxDepth(getSearchableTypes(mockSchema))

    expect(searchableTypes[0].__experimental_search).toEqual([
      {path: ['_id'], weight: 1},
      {path: ['_type'], weight: 1},
      {path: ['title'], weight: 10},
    ])
    expect(searchableTypes[1].__experimental_search).toEqual([
      {path: ['_id'], weight: 1},
      {path: ['_type'], weight: 1},
      {path: ['title'], weight: 10},
      {path: ['nestedObject', 'field1'], weight: 1},
      {path: ['nestedObject', 'field2'], weight: 1},
      {path: ['nestedObject', 'field3', 'nested1'], weight: 1},
      {path: ['nestedObject', 'field3', 'nested2', 'ge'], weight: 1},
    ])
    // expect(result[1].score).toEqual(10)
  })

  it('should limit search fields if maxFieldDepth is set to level 3', async () => {
    const searchableTypesL3 = getSearchTypesWithMaxDepth(getSearchableTypes(mockSchema), 3)

    expect(searchableTypesL3[0].__experimental_search).toEqual([
      {path: ['_id'], weight: 1},
      {path: ['_type'], weight: 1},
      {path: ['title'], weight: 10},
    ])

    expect(searchableTypesL3[1].__experimental_search).toEqual([
      {path: ['_id'], weight: 1},
      {path: ['_type'], weight: 1},
      {path: ['title'], weight: 10},
      {path: ['nestedObject', 'field1'], weight: 1},
      {path: ['nestedObject', 'field2'], weight: 1},
    ])
  })

  it('should limit search fields if maxFieldDepth is set to level 4', async () => {
    const searchableTypesL4 = getSearchTypesWithMaxDepth(getSearchableTypes(mockSchema), 4)

    expect(searchableTypesL4[1].__experimental_search).toEqual([
      {path: ['_id'], weight: 1},
      {path: ['_type'], weight: 1},
      {path: ['title'], weight: 10},
      {path: ['nestedObject', 'field1'], weight: 1},
      {path: ['nestedObject', 'field2'], weight: 1},
      {path: ['nestedObject', 'field3', 'nested1'], weight: 1},
    ])
  })
})

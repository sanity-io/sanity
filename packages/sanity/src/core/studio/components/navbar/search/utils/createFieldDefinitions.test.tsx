import {Schema} from '@sanity/schema'
import React from 'react'
import {filterDefinitions} from '../definitions/defaultFilters'
import {createFieldDefinitions, MAX_OBJECT_TRAVERSAL_DEPTH} from './createFieldDefinitions'
import {generateFieldId} from './generateFieldId'

describe('createFieldDefinitions', () => {
  it('should create a flattened list of all available fields', () => {
    const mockSchema = Schema.compile({
      name: 'default',
      types: [
        {
          name: 'author',
          title: 'Author',
          type: 'document',
          fields: [{name: 'name', type: 'string'}],
        },
      ],
    })
    const fieldDefs = createFieldDefinitions(mockSchema, filterDefinitions)
    expect(fieldDefs).toEqual([
      {
        documentTypes: ['author'],
        fieldPath: 'name',
        filterName: 'string',
        id: generateFieldId(fieldDefs[0]),
        name: 'name',
        titlePath: ['Name'],
        title: 'Name',
        type: 'string',
      },
    ])
  })

  it('should always include hidden fields', () => {
    const mockSchema = Schema.compile({
      name: 'default',
      types: [
        {
          name: 'author',
          title: 'Author',
          type: 'document',
          fields: [
            {name: 'name', type: 'string', hidden: true},
            {name: 'nickname', type: 'string', hidden: false},
            {name: 'location', type: 'text', hidden: () => true},
            {name: 'age', type: 'number'},
          ],
        },
      ],
    })

    const fieldDefs = createFieldDefinitions(mockSchema, filterDefinitions)
    expect(fieldDefs.length).toEqual(4)
  })

  it('should only traverse nested object fields up until a certain depth', () => {
    //
    function generateRecursiveObjectFields(maxDepth: number, level = 0): Record<string, any>[] {
      return [
        {name: `name-${level}`, type: 'string'},
        ...(level < maxDepth
          ? [
              {
                name: `object-${level}`,
                fields: generateRecursiveObjectFields(maxDepth, level + 1),
                type: 'object',
              },
            ]
          : []),
      ]
    }

    const mockSchema = Schema.compile({
      name: 'default',
      types: [
        {
          name: 'author',
          title: 'Author',
          type: 'document',
          fields: generateRecursiveObjectFields(3),
        },
      ],
    })

    const fieldDefs = createFieldDefinitions(mockSchema, filterDefinitions)
    expect(fieldDefs.length).toEqual(MAX_OBJECT_TRAVERSAL_DEPTH + 1)
  })

  it('should correctly traverse recursive documents', () => {
    const mockSchema = Schema.compile({
      name: 'default',
      types: [
        {
          name: 'author',
          title: 'Author',
          type: 'document',
          fields: [
            {name: 'name', type: 'string'},
            {name: 'author', type: 'author'},
          ],
        },
      ],
    })

    const fieldDefs = createFieldDefinitions(mockSchema, filterDefinitions)
    expect(fieldDefs.length).toEqual(MAX_OBJECT_TRAVERSAL_DEPTH + 1)
  })

  it('should assign the correct filter to strings with list options', () => {
    const mockSchema = Schema.compile({
      name: 'default',
      types: [
        {
          name: 'author',
          title: 'Author',
          type: 'document',
          fields: [
            {
              name: 'location',
              type: 'string',
              options: {
                list: ['new york', 'london', 'paris'],
              },
            },
          ],
        },
      ],
    })

    const fieldDefs = createFieldDefinitions(mockSchema, filterDefinitions)
    expect(fieldDefs[0].filterName).toEqual('stringList')
  })

  it('should assign the correct filter to arrays containing block elements', () => {
    const mockSchema = Schema.compile({
      name: 'default',
      types: [
        {
          name: 'author',
          title: 'Author',
          type: 'document',
          fields: [
            {
              name: 'bio',
              type: 'array',
              of: [{type: 'block'}],
            },
          ],
        },
      ],
    })

    const fieldDefs = createFieldDefinitions(mockSchema, filterDefinitions)
    expect(fieldDefs[0].filterName).toEqual('portableText')
  })

  it('should assign the correct filter to arrays containing references', () => {
    const mockSchema = Schema.compile({
      name: 'default',
      types: [
        {
          name: 'author',
          title: 'Author',
          type: 'document',
          fields: [
            {
              name: 'books',
              type: 'array',
              of: [{type: 'reference', to: [{type: 'book'}]}],
            },
          ],
        },
        {
          name: 'book',
          title: 'Book',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
        },
      ],
    })

    const fieldDefs = createFieldDefinitions(mockSchema, filterDefinitions)
    expect(fieldDefs[0].filterName).toEqual('arrayReferences')
  })

  it('should assign the correct filter to arrays containing option lists', () => {
    const mockSchema = Schema.compile({
      name: 'default',
      types: [
        {
          name: 'author',
          title: 'Author',
          type: 'document',
          fields: [
            {
              name: 'books',
              type: 'array',
              of: [{type: 'string'}],
              options: {
                list: [
                  {title: 'Cats', value: 'cats4ever'},
                  {title: 'Dogs', value: 'dogs4ever'},
                  'Horses',
                ],
              },
            },
          ],
        },
      ],
    })

    const fieldDefs = createFieldDefinitions(mockSchema, filterDefinitions)
    expect(fieldDefs[0].filterName).toEqual('arrayList')
  })

  it('should correctly sanitize titles containing React components', () => {
    const mockSchema = Schema.compile({
      name: 'default',
      types: [
        {
          name: 'author',
          title: 'Author',
          type: 'document',
          fields: [
            {
              name: 'Title',
              title: (
                <div>
                  <a href="#">
                    <img src="./example.jpg" />
                  </a>
                  <span style={{color: 'red'}}>A title wrapped in a component</span>
                </div>
              ),
              type: 'string',
            },
          ],
        },
      ],
    })

    const fieldDefs = createFieldDefinitions(mockSchema, filterDefinitions)
    expect(fieldDefs[0].title).toEqual('A title wrapped in a component')
  })
})

export {}

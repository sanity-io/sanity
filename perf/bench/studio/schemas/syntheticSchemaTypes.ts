import {type SchemaTypeDefinition} from 'sanity'

export const syntheticSchemaTypes = [
  {
    name: 'synthetic',
    type: 'document',
    fields: [
      {name: 'title', type: 'string'},
      {name: 'arrayOfObjects', type: 'array', of: [{type: 'syntheticObject'}]},
      {name: 'syntheticObject', type: 'syntheticObject'},
    ],
  },
  {
    name: 'syntheticObject',
    type: 'object',
    fields: [
      {name: 'name', type: 'string'},
      {name: 'image', type: 'image'},
      {name: 'file', type: 'file'},
      {name: 'geopoint', type: 'geopoint'},
      {name: 'number', type: 'number'},
      {name: 'string', type: 'string'},
      {name: 'boolean', type: 'boolean'},
      {name: 'slug', type: 'slug'},
      {name: 'text', type: 'text'},
      {name: 'reference', type: 'reference', to: [{type: 'synthetic'}]},
      {name: 'date', type: 'date'},
      {name: 'datetime', type: 'datetime'},
      {name: 'nestedObject', type: 'syntheticObject'},
      ...Array.from({length: 20}, (_, index) => ({name: `field${index}`, type: 'string'})),
    ],
  },
] satisfies SchemaTypeDefinition[]

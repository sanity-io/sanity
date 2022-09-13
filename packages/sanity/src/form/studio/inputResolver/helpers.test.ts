/* eslint max-nested-callbacks: */

import {getObjectFieldLevel, type PartialObjectFieldProps} from './helpers'

type SchemaSnippet = PartialObjectFieldProps['schemaType']
type SchemaTest = SchemaSnippet & {description: string}

const noIndentation: SchemaTest[] = [
  {description: 'any array', name: 'array'},
  {description: 'file without additional fields', name: 'file', fields: [{name: 'asset'}]},
  {
    description: 'image without additional fields',
    name: 'image',
    fields: [{name: 'asset'}, {name: 'crop'}, {name: 'hotspot'}],
  },
  {description: 'any reference', name: 'reference', fields: [{name: '_ref'}, {name: '_weak'}]},
  {description: 'any slug', name: 'slug', fields: [{name: 'current'}]},
]

const hasIndentation: SchemaTest[] = [
  {description: 'string without list', name: 'string'},
  {description: 'string with empty list', name: 'string', options: {list: []}},
  {description: 'string with list', name: 'string', options: {list: ['dummy']}},

  {description: 'number with list', name: 'number', options: {list: [1]}},
  {description: 'number without list', name: 'number'},
  {description: 'number with empty list', name: 'number', options: {list: []}},

  {description: 'object with (visible) fields', name: 'object', fields: [{name: 'title'}]},
  {description: 'object with no fields', name: 'object', fields: []},
  {
    description: 'file with additional fields',
    name: 'file',
    fields: [{name: 'caption'}, {name: 'asset'}],
  },
  {
    description: 'image with additional fields',
    name: 'image',
    fields: [{name: 'caption'}, {name: 'asset'}, {name: 'crop'}, {name: 'hotspot'}],
  },
]

function createBaseType(snippet: SchemaSnippet): SchemaSnippet {
  return {
    ...snippet,
    type: snippet,
  }
}

function createAlias(snippet: SchemaSnippet): SchemaSnippet {
  const parentType = createBaseType(snippet)
  const alias = {
    ...parentType,
    name: `${parentType.name}-alias`,
    type: parentType,
  }
  // schemas seem to self-reference first, then recurse
  return {
    ...alias,
    type: alias,
  }
}

describe('inputResolver/helpers', () => {
  describe('getObjectFieldLevel', () => {
    const GREATER_THAN_ZERO = 5

    noIndentation.forEach((schemaSnippet) => {
      describe('types without indentation', () => {
        it(`should return level 0 for ${schemaSnippet.description}`, () => {
          const field = {schemaType: createBaseType(schemaSnippet), level: GREATER_THAN_ZERO}
          const baseLevel = getObjectFieldLevel(field)
          expect(baseLevel).toEqual(0)
        })

        it(`should return level 0 for ${schemaSnippet.description} alias`, () => {
          const field = {
            schemaType: createAlias(schemaSnippet),
            level: GREATER_THAN_ZERO,
          }
          const aliasLevel = getObjectFieldLevel(field)
          expect(aliasLevel).toEqual(0)
        })
      })
    })

    describe('types with indentation', () => {
      hasIndentation.forEach((schemaSnippet) => {
        it(`should return level > 0 for ${schemaSnippet.name}`, () => {
          const field = {schemaType: createBaseType(schemaSnippet), level: GREATER_THAN_ZERO}
          const baseLevel = getObjectFieldLevel(field)
          expect(baseLevel).toEqual(GREATER_THAN_ZERO)
        })

        it(`should return level > 0 for ${schemaSnippet.name} alias`, () => {
          const field = {
            schemaType: createAlias(schemaSnippet),
            level: GREATER_THAN_ZERO,
          }
          const aliasLevel = getObjectFieldLevel(field)
          expect(aliasLevel).toEqual(GREATER_THAN_ZERO)
        })
      })
    })
  })
})

export {}

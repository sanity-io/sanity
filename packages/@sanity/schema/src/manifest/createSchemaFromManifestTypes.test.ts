import {type Schema as SanitySchema} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {Schema} from '../legacy/Schema'
import {builtinTypes} from '../sanity/builtinTypes'
import {validateSchema} from '../sanity/validateSchema'
import {ValidationError} from '../sanity/validation/ValidationError'
import {createSchemaFromManifestTypes} from './createSchemaFromManifestTypes'
import {extractManifestSchemaTypes} from './extractManifestSchemaTypes'

describe('createSchemaFromManifestTypes', () => {
  test.each(['sanity.imageAsset', 'sanity.fileAsset'])(
    'roundtrips a reference to the builtin %s document',
    (assetType) => {
      const source = Schema.compile({
        name: 'studio',
        parent: Schema.compile({name: 'builtin', types: builtinTypes}),
        types: [
          {
            name: 'article',
            type: 'document',
            fields: [{name: 'asset', type: 'reference', to: [{type: assetType}]}],
          },
        ],
      })
      const types = JSON.parse(JSON.stringify(extractManifestSchemaTypes(source as SanitySchema)))
      expect(types.map((type: {name: string}) => type.name)).toEqual(['article'])

      const schema = createSchemaFromManifestTypes({name: 'reconstructed', types})
      expect(schema.getLocalTypeNames()).toEqual(['article'])
      expect(schema.get('article').fields[0].type.to[0].name).toBe(assetType)
      expect(schema.get(assetType).type.name).toBe('document')
    },
  )

  test('parent types do not become local validation types', () => {
    const validation = validateSchema([{name: 'article', type: 'document', fields: []}], {
      parentTypes: builtinTypes,
    })
    expect(validation.has('sanity.imageAsset')).toBe(true)
    expect(validation.getTypeNames()).toEqual(['article'])
    expect(validation.getTypes().map((type) => type.name)).toEqual(['article'])
  })

  test.each(['sanity.missingAsset', 'missingType'])('rejects an unknown target %s', (type) => {
    expect(() =>
      createSchemaFromManifestTypes({
        name: 'invalid',
        types: [
          {
            name: 'article',
            type: 'document',
            fields: [{name: 'asset', type: 'reference', to: [{type}]}],
          },
        ],
      }),
    ).toThrow(ValidationError)
  })

  test('rejects local definitions with reserved core names', () => {
    expect(() =>
      createSchemaFromManifestTypes({
        name: 'invalid',
        types: [{name: 'string', type: 'object', fields: [{name: 'value', type: 'string'}]}],
      }),
    ).toThrow(ValidationError)
  })
})

import {defineField, defineType, type Schema as SanitySchema} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {Schema} from '../../src/legacy/Schema'
import {createSchemaFromManifestTypes} from '../../src/manifest/createSchemaFromManifestTypes'
import {extractManifestSchemaTypes} from '../../src/manifest/extractManifestSchemaTypes'
import {builtinTypes} from '../../src/sanity/builtinTypes'
import {resolveExtendableTypes} from '../../src/sanity/builtinTypes/extendableTypes'
import releaseMetadata, {
  RELEASE_METADATA_TYPE_NAME,
} from '../../src/sanity/builtinTypes/extendableTypes/releaseMetadata'
import {isSystemDocumentTypeName} from '../../src/sanity/builtinTypes/systemTypes'
import {RELEASE_DOCUMENT_TYPE_NAME} from '../../src/sanity/builtinTypes/systemTypes/release'
import {extractSchema} from '../../src/sanity/extractSchema'
import {groupProblems} from '../../src/sanity/groupProblems'
import {validateSchema} from '../../src/sanity/validateSchema'

const releaseMetadataCoreFieldNames = releaseMetadata.fields.map((field) => field.name)

const book = defineType({
  name: 'book',
  type: 'document',
  fields: [defineField({name: 'title', type: 'string'})],
})

const customMetadata = defineType({
  name: RELEASE_METADATA_TYPE_NAME,
  type: 'object',
  fields: [
    defineField({name: 'legalReview', type: 'string'}),
    defineField({
      name: 'signOff',
      type: 'object',
      fields: [defineField({name: 'reviewer', type: 'string'})],
    }),
  ],
})

function fieldNames(typeDef: unknown): unknown[] {
  const fields = (typeDef as {fields: {name: string}[]}).fields
  return fields.map((field) => field.name)
}

function typeNames(types: unknown[]): unknown[] {
  return types.map((typeDef) => (typeDef as {name: string}).name)
}

function findType(types: unknown[], name: string): unknown {
  return types.find((typeDef) => (typeDef as {name?: string}).name === name)
}

function metadataFieldType(schema: Schema) {
  return schema
    .get(RELEASE_DOCUMENT_TYPE_NAME)
    .fields.find((field: {name: string}) => field.name === 'metadata').type
}

function errorMessages(types: unknown[], options?: Parameters<typeof validateSchema>[1]): string[] {
  return groupProblems(validateSchema(types, options).getTypes()).flatMap((group) =>
    group.problems
      .filter((problem) => problem.severity === 'error')
      .map((problem) => problem.message),
  )
}

const builtinSchema = Schema.compile({name: 'builtin', types: builtinTypes})

function compile(types: unknown[]) {
  return Schema.compile({name: 'test', types, parent: builtinSchema})
}

function extractManifest(types: unknown[]): unknown[] {
  const schema = compile(resolveExtendableTypes(types)) as SanitySchema
  return JSON.parse(JSON.stringify(extractManifestSchemaTypes(schema)))
}

describe('resolveExtendableTypes', () => {
  test('returns a schema without extendable types as it is', () => {
    expect(resolveExtendableTypes([book])).toEqual([book])
  })

  test('prepends the core fields to a declared extendable type', () => {
    const types = resolveExtendableTypes([customMetadata, book])

    expect(types).not.toContain(customMetadata)
    expect(typeNames(types)).toEqual([RELEASE_METADATA_TYPE_NAME, 'book'])
    expect(fieldNames(findType(types, RELEASE_METADATA_TYPE_NAME))).toEqual([
      ...releaseMetadataCoreFieldNames,
      'legalReview',
      'signOff',
    ])
  })

  test('gives a declared extendable type without fields the core fields', () => {
    const types = resolveExtendableTypes([
      {name: RELEASE_METADATA_TYPE_NAME, type: 'object', title: 'Release details'},
    ])

    expect(fieldNames(findType(types, RELEASE_METADATA_TYPE_NAME))).toEqual(
      releaseMetadataCoreFieldNames,
    )
    expect(errorMessages(types)).toEqual([])
  })

  test('replaces a declared core field with the built-in one', () => {
    const declaredTitle = defineField({name: 'title', title: 'Release name', type: 'string'})
    const types = resolveExtendableTypes([
      defineType({
        name: RELEASE_METADATA_TYPE_NAME,
        type: 'object',
        fields: [defineField({name: 'legalReview', type: 'string'}), declaredTitle],
      }),
    ])
    const fields = (findType(types, RELEASE_METADATA_TYPE_NAME) as {fields: unknown[]}).fields

    expect(fieldNames(findType(types, RELEASE_METADATA_TYPE_NAME))).toEqual([
      ...releaseMetadataCoreFieldNames,
      'legalReview',
    ])
    expect(fields).not.toContain(declaredTitle)
    expect(fields[0]).toBe(releaseMetadata.fields[0])
    expect(errorMessages(types)).toEqual([])
  })

  test('does not treat a type named `releaseMetadata` as the release metadata type', () => {
    const userType = defineType({
      name: 'releaseMetadata',
      type: 'object',
      fields: [defineField({name: 'note', type: 'string'})],
    })

    expect(resolveExtendableTypes([userType])).toEqual([userType])
  })
})

describe('isSystemDocumentTypeName', () => {
  test('matches the system document types and nothing else', () => {
    expect(isSystemDocumentTypeName(RELEASE_DOCUMENT_TYPE_NAME)).toBe(true)
    expect(isSystemDocumentTypeName(RELEASE_METADATA_TYPE_NAME)).toBe(false)
    expect(isSystemDocumentTypeName('book')).toBe(false)
    expect(isSystemDocumentTypeName(undefined)).toBe(false)
  })
})

describe('extendable type validation', () => {
  test('accepts a schema with and without an extension', () => {
    expect(errorMessages(resolveExtendableTypes([book]))).toEqual([])
    expect(errorMessages(resolveExtendableTypes([customMetadata, book]))).toEqual([])
  })

  test('accepts an extension when the built-in types are the parent types', () => {
    expect(
      errorMessages(resolveExtendableTypes([customMetadata]), {parentTypes: builtinTypes}),
    ).toEqual([])
  })

  test('rejects an extension that is not an object', () => {
    const types = resolveExtendableTypes([{name: RELEASE_METADATA_TYPE_NAME, type: 'string'}])

    expect(errorMessages(types)).toContain(
      `The "${RELEASE_METADATA_TYPE_NAME}" type must be an object type, but it is "string".`,
    )
  })

  test('rejects a schema that declares a system document type', () => {
    const types = [
      defineType({
        name: RELEASE_DOCUMENT_TYPE_NAME,
        type: 'document',
        fields: [defineField({name: 'name', type: 'string'})],
      }),
    ]

    expect(errorMessages(types)).toContain(
      `Invalid type name: "${RELEASE_DOCUMENT_TYPE_NAME}" is a system document type and can't be declared in a schema.`,
    )
  })
})

describe('compiling with the built-in schema', () => {
  test('a schema without an extension inherits the release types and has none of its own', () => {
    const schema = compile([book])

    expect(schema.getLocalTypeNames()).toEqual(['book'])
    expect(schema.get(RELEASE_DOCUMENT_TYPE_NAME)).toBe(
      builtinSchema.get(RELEASE_DOCUMENT_TYPE_NAME),
    )
    expect(fieldNames(schema.get(RELEASE_METADATA_TYPE_NAME))).toEqual(
      releaseMetadataCoreFieldNames,
    )
  })

  test('an extension replaces the built-in metadata type as a local type', () => {
    const schema = compile(resolveExtendableTypes([customMetadata]))

    expect(schema.getLocalTypeNames()).toEqual([RELEASE_METADATA_TYPE_NAME])
    expect(fieldNames(schema.get(RELEASE_METADATA_TYPE_NAME))).toEqual([
      ...releaseMetadataCoreFieldNames,
      'legalReview',
      'signOff',
    ])
    expect(fieldNames(builtinSchema.get(RELEASE_METADATA_TYPE_NAME))).toEqual(
      releaseMetadataCoreFieldNames,
    )
  })

  test('the release document is compiled again to use the extension, without becoming local', () => {
    const schema = compile(resolveExtendableTypes([customMetadata]))
    const release = schema.get(RELEASE_DOCUMENT_TYPE_NAME)

    expect(release).not.toBe(builtinSchema.get(RELEASE_DOCUMENT_TYPE_NAME))
    expect(release.liveEdit).toBe(true)
    expect(release.readOnly).toBe(true)
    expect(fieldNames(metadataFieldType(schema))).toEqual([
      ...releaseMetadataCoreFieldNames,
      'legalReview',
      'signOff',
    ])
    expect(fieldNames(metadataFieldType(builtinSchema))).toEqual(releaseMetadataCoreFieldNames)
  })

  test('a type declared before the extension it uses resolves to the extension', () => {
    const schema = compile(
      resolveExtendableTypes([
        {name: 'usesMetadata', type: RELEASE_METADATA_TYPE_NAME},
        customMetadata,
      ]),
    )

    expect(fieldNames(schema.get('usesMetadata'))).toContain('legalReview')
  })
})

describe('exporting the schema', () => {
  test('extractSchema includes the release document and the custom metadata fields', () => {
    const extracted = extractSchema(compile(resolveExtendableTypes([customMetadata, book])))
    const release = extracted.find((type) => type.name === RELEASE_DOCUMENT_TYPE_NAME)
    const metadata = extracted.find((type) => type.name === RELEASE_METADATA_TYPE_NAME)

    expect(release).toMatchObject({
      type: 'document',
      attributes: {
        metadata: {
          type: 'objectAttribute',
          value: {type: 'inline', name: RELEASE_METADATA_TYPE_NAME},
        },
      },
    })
    expect(metadata).toMatchObject({
      type: 'type',
      value: {
        type: 'object',
        attributes: {
          title: {type: 'objectAttribute', value: {type: 'string'}},
          releaseType: {
            type: 'objectAttribute',
            value: {
              type: 'union',
              of: [
                {type: 'string', value: 'asap'},
                {type: 'string', value: 'scheduled'},
                {type: 'string', value: 'undecided'},
              ],
            },
          },
          legalReview: {type: 'objectAttribute', value: {type: 'string'}},
          signOff: {type: 'objectAttribute'},
        },
      },
    })
  })

  test('a manifest carries the extension with only its added fields, and no release document', () => {
    const manifest = extractManifest([customMetadata, book])

    expect(typeNames(manifest)).toEqual([RELEASE_METADATA_TYPE_NAME, 'book'])
    expect(fieldNames(findType(manifest, RELEASE_METADATA_TYPE_NAME))).toEqual([
      'legalReview',
      'signOff',
    ])

    const rebuilt = createSchemaFromManifestTypes({name: 'manifest', types: manifest})
    const metadata = rebuilt.get(RELEASE_METADATA_TYPE_NAME)
    expect(fieldNames(metadata)).toEqual([
      ...releaseMetadataCoreFieldNames,
      'legalReview',
      'signOff',
    ])
    expect(fieldNames(metadataFieldType(rebuilt))).toEqual([
      ...releaseMetadataCoreFieldNames,
      'legalReview',
      'signOff',
    ])
    const intendedPublishAt = metadata.fields.find(
      (field: {name: string}) => field.name === 'intendedPublishAt',
    )
    expect(intendedPublishAt.type.hidden).toBeTypeOf('function')
  })

  test('a manifest of a schema without an extension leaves both release types out', () => {
    const manifest = extractManifest([book])
    expect(typeNames(manifest)).toEqual(['book'])

    const rebuilt = createSchemaFromManifestTypes({name: 'manifest', types: manifest})
    expect(rebuilt.get(RELEASE_DOCUMENT_TYPE_NAME).liveEdit).toBe(true)
    expect(fieldNames(rebuilt.get(RELEASE_METADATA_TYPE_NAME))).toEqual(
      releaseMetadataCoreFieldNames,
    )
  })

  test('a manifest carries an extension that only changes type options', () => {
    const manifest = extractManifest([
      {name: RELEASE_METADATA_TYPE_NAME, type: 'object', title: 'Release details'},
    ])
    const metadata = findType(manifest, RELEASE_METADATA_TYPE_NAME)

    expect(metadata).toMatchObject({name: RELEASE_METADATA_TYPE_NAME, title: 'Release details'})
    expect(metadata).not.toHaveProperty('fields')
  })

  test('a schema built from a manifest uses the built-in release document type', () => {
    const schema = createSchemaFromManifestTypes({
      name: 'manifest',
      types: [
        book,
        {
          name: RELEASE_DOCUMENT_TYPE_NAME,
          type: 'document',
          fields: [{name: 'name', type: 'string'}],
        },
        customMetadata,
      ],
    })

    expect(schema.get(RELEASE_DOCUMENT_TYPE_NAME).liveEdit).toBe(true)
    expect(fieldNames(schema.get(RELEASE_METADATA_TYPE_NAME))).toEqual([
      ...releaseMetadataCoreFieldNames,
      'legalReview',
      'signOff',
    ])
  })

  test('a serialized metadata type that still carries the core fields gets them from code', () => {
    const metadata = createSchemaFromManifestTypes({
      name: 'descriptor',
      types: [
        {
          name: RELEASE_METADATA_TYPE_NAME,
          type: 'object',
          fields: [
            {name: 'title', type: 'string'},
            {name: 'intendedPublishAt', type: 'datetime', hidden: 'conditional'},
            {name: 'legalReview', type: 'string'},
          ],
        },
      ],
    }).get(RELEASE_METADATA_TYPE_NAME)

    expect(fieldNames(metadata)).toEqual([...releaseMetadataCoreFieldNames, 'legalReview'])
    const intendedPublishAt = metadata.fields.find(
      (field: {name: string}) => field.name === 'intendedPublishAt',
    )
    expect(intendedPublishAt.type.hidden).toBeTypeOf('function')
  })
})

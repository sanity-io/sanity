import {defineField, defineType, type Schema as SanitySchema} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {Schema} from '../../src/legacy/Schema'
import {createSchemaFromManifestTypes} from '../../src/manifest/createSchemaFromManifestTypes'
import {extractManifestSchemaTypes} from '../../src/manifest/extractManifestSchemaTypes'
import {builtinTypes} from '../../src/sanity/builtinTypes'
import {extractSchema} from '../../src/sanity/extractSchema'
import {groupProblems} from '../../src/sanity/groupProblems'
import {
  extendableTypes,
  isSystemDocumentTypeName,
  resolveExtendableTypes,
  systemDocumentTypes,
} from '../../src/sanity/systemTypes/extendableTypes'
import {RELEASE_DOCUMENT_TYPE_NAME} from '../../src/sanity/systemTypes/release'
import releaseMetadata, {
  RELEASE_METADATA_TYPE_NAME,
} from '../../src/sanity/systemTypes/releaseMetadata'
import {validateSchema} from '../../src/sanity/validateSchema'

const releaseMetadataCoreFieldNames = releaseMetadata.fields.map((field) => field.name)
const defaultTypes = [...systemDocumentTypes, ...extendableTypes]

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

function findType(types: unknown[], name: string): unknown {
  return types.find((typeDef) => (typeDef as {name?: string}).name === name)
}

function errorMessages(types: unknown[]): string[] {
  return groupProblems(validateSchema(types).getTypes()).flatMap((group) =>
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
  test('adds the release document and default metadata types', () => {
    const types = resolveExtendableTypes([book])

    expect(types).toEqual([book, ...defaultTypes])
    expect(fieldNames(findType(types, RELEASE_METADATA_TYPE_NAME))).toEqual(
      releaseMetadataCoreFieldNames,
    )
  })

  test('replaces the default metadata type with a custom one and prepends the core fields', () => {
    const types = resolveExtendableTypes([customMetadata, book])
    const metadata = findType(types, RELEASE_METADATA_TYPE_NAME)

    expect(types).not.toContain(customMetadata)
    expect(types.map((typeDef) => (typeDef as {name: string}).name)).toEqual([
      RELEASE_METADATA_TYPE_NAME,
      'book',
      RELEASE_DOCUMENT_TYPE_NAME,
    ])
    expect(fieldNames(metadata)).toEqual([
      ...releaseMetadataCoreFieldNames,
      'legalReview',
      'signOff',
    ])
  })

  test('gives a custom metadata type without fields the core fields', () => {
    const types = resolveExtendableTypes([
      {name: RELEASE_METADATA_TYPE_NAME, type: 'object', title: 'Release details'},
    ])

    expect(fieldNames(findType(types, RELEASE_METADATA_TYPE_NAME))).toEqual(
      releaseMetadataCoreFieldNames,
    )
    expect(errorMessages(types)).toEqual([])
  })

  test('does not treat a type named `releaseMetadata` as the release metadata type', () => {
    const userType = defineType({
      name: 'releaseMetadata',
      type: 'object',
      fields: [defineField({name: 'note', type: 'string'})],
    })
    const types = resolveExtendableTypes([userType])

    expect(types).toEqual([userType, ...defaultTypes])
    expect(errorMessages(types)).toEqual([])
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
  test('accepts the default and custom metadata types', () => {
    expect(errorMessages(resolveExtendableTypes([book]))).toEqual([])
    expect(errorMessages(resolveExtendableTypes([customMetadata, book]))).toEqual([])
  })

  test('rejects a custom metadata type that declares a core field', () => {
    const types = resolveExtendableTypes([
      defineType({
        name: RELEASE_METADATA_TYPE_NAME,
        type: 'object',
        fields: [
          defineField({name: 'legalReview', type: 'string'}),
          defineField({name: 'title', title: 'Release name', type: 'string'}),
        ],
      }),
    ])

    expect(errorMessages(types)).toEqual([
      `The names \`title\`, \`description\`, \`releaseType\`, \`intendedPublishAt\`, \`cardinality\` are invalid field names for type \`${RELEASE_METADATA_TYPE_NAME}\`. These core fields are always included.`,
    ])
  })

  test('rejects a metadata type that is not an object', () => {
    const types = resolveExtendableTypes([{name: RELEASE_METADATA_TYPE_NAME, type: 'string'}])

    expect(errorMessages(types)).toContain(
      `The "${RELEASE_METADATA_TYPE_NAME}" type must be an object type, but it is "string".`,
    )
  })

  test('reports a schema that also declares the release document type', () => {
    const types = resolveExtendableTypes([
      defineType({
        name: RELEASE_DOCUMENT_TYPE_NAME,
        type: 'document',
        fields: [defineField({name: 'name', type: 'string'})],
      }),
    ])

    expect(errorMessages(types)).toContain(
      `Invalid type name: A type with name "${RELEASE_DOCUMENT_TYPE_NAME}" is already defined in the schema.`,
    )
  })
})

describe('compiled release types', () => {
  test('the release document is live-edit, read-only and uses the metadata type', () => {
    const schema = compile(resolveExtendableTypes([customMetadata]))
    const release = schema.get(RELEASE_DOCUMENT_TYPE_NAME)
    const metadataField = release.fields.find((field: {name: string}) => field.name === 'metadata')

    expect(release.liveEdit).toBe(true)
    expect(release.readOnly).toBe(true)
    expect(metadataField.type.name).toBe(RELEASE_METADATA_TYPE_NAME)
    expect(
      schema.get(RELEASE_METADATA_TYPE_NAME).fields.map((field: {name: string}) => field.name),
    ).toEqual([...releaseMetadataCoreFieldNames, 'legalReview', 'signOff'])
  })

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
    expect(
      schema.get(RELEASE_METADATA_TYPE_NAME).fields.map((field: {name: string}) => field.name),
    ).toEqual([...releaseMetadataCoreFieldNames, 'legalReview', 'signOff'])
  })

  test('a manifest carries only the custom metadata fields and the core fields are rebuilt from code', () => {
    const manifest = extractManifest([customMetadata, book])
    expect(fieldNames(findType(manifest, RELEASE_METADATA_TYPE_NAME))).toEqual([
      'legalReview',
      'signOff',
    ])

    const metadata = createSchemaFromManifestTypes({name: 'manifest', types: manifest}).get(
      RELEASE_METADATA_TYPE_NAME,
    )
    expect(fieldNames(metadata)).toEqual([
      ...releaseMetadataCoreFieldNames,
      'legalReview',
      'signOff',
    ])
    const intendedPublishAt = metadata.fields.find(
      (field: {name: string}) => field.name === 'intendedPublishAt',
    )
    expect(intendedPublishAt.type.hidden).toBeTypeOf('function')
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

  test('a manifest of the default metadata type carries no fields', () => {
    const manifest = extractManifest([book])
    expect(findType(manifest, RELEASE_METADATA_TYPE_NAME)).not.toHaveProperty('fields')

    const metadata = createSchemaFromManifestTypes({name: 'manifest', types: manifest}).get(
      RELEASE_METADATA_TYPE_NAME,
    )
    expect(fieldNames(metadata)).toEqual(releaseMetadataCoreFieldNames)
  })
})

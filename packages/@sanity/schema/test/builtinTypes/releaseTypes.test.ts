import {defineField, defineType} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {Schema} from '../../src/legacy/Schema'
import {createSchemaFromManifestTypes} from '../../src/manifest/createSchemaFromManifestTypes'
import {builtinTypes} from '../../src/sanity/builtinTypes'
import {
  defaultReleaseTypes,
  RELEASE_DOCUMENT_TYPE_NAME,
  RELEASE_METADATA_TYPE_NAME,
  releaseMetadataCoreFieldNames,
  resolveReleaseTypes,
} from '../../src/sanity/builtinTypes/releaseTypes'
import {extractSchema} from '../../src/sanity/extractSchema'
import {groupProblems} from '../../src/sanity/groupProblems'
import {validateSchema} from '../../src/sanity/validateSchema'

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

describe('resolveReleaseTypes', () => {
  test('adds the release document and default metadata types', () => {
    const types = resolveReleaseTypes([book])

    expect(types).toEqual([book, ...defaultReleaseTypes])
    expect(fieldNames(findType(types, RELEASE_METADATA_TYPE_NAME))).toEqual(
      releaseMetadataCoreFieldNames,
    )
  })

  test('replaces the default metadata type with a custom one and prepends the core fields', () => {
    const types = resolveReleaseTypes([customMetadata, book])
    const metadata = findType(types, RELEASE_METADATA_TYPE_NAME)

    expect(types.filter((typeDef) => typeDef === customMetadata)).toHaveLength(0)
    expect(types.at(-1)).toBe(metadata)
    expect(fieldNames(metadata)).toEqual([
      ...releaseMetadataCoreFieldNames,
      'legalReview',
      'signOff',
    ])
  })

  test('keeps a redeclared core field where the custom type declares it', () => {
    const title = defineField({name: 'title', title: 'Release name', type: 'string'})
    const types = resolveReleaseTypes([
      defineType({
        name: RELEASE_METADATA_TYPE_NAME,
        type: 'object',
        fields: [defineField({name: 'legalReview', type: 'string'}), title],
      }),
    ])
    const metadata = findType(types, RELEASE_METADATA_TYPE_NAME) as {fields: unknown[]}

    expect(fieldNames(metadata)).toEqual([
      'description',
      'releaseType',
      'intendedPublishAt',
      'cardinality',
      'legalReview',
      'title',
    ])
    expect(metadata.fields.at(-1)).toBe(title)
  })

  test('does not treat a type named `releaseMetadata` as the release metadata type', () => {
    const userType = defineType({
      name: 'releaseMetadata',
      type: 'object',
      fields: [defineField({name: 'note', type: 'string'})],
    })
    const types = resolveReleaseTypes([userType])

    expect(types).toEqual([userType, ...defaultReleaseTypes])
    expect(errorMessages(types)).toEqual([])
  })
})

describe('release metadata validation', () => {
  test('accepts the default and custom metadata types', () => {
    expect(errorMessages(resolveReleaseTypes([book]))).toEqual([])
    expect(errorMessages(resolveReleaseTypes([customMetadata, book]))).toEqual([])
  })

  test('accepts a core field redeclared with a type that stores a string', () => {
    const types = resolveReleaseTypes([
      defineType({name: 'shortText', type: 'text'}),
      defineType({
        name: RELEASE_METADATA_TYPE_NAME,
        type: 'object',
        fields: [defineField({name: 'description', type: 'shortText'})],
      }),
    ])

    expect(errorMessages(types)).toEqual([])
  })

  test('rejects a core field redeclared with a type that stores something else', () => {
    const types = resolveReleaseTypes([
      defineType({
        name: 'titleObject',
        type: 'object',
        fields: [defineField({name: 'text', type: 'string'})],
      }),
      defineType({
        name: RELEASE_METADATA_TYPE_NAME,
        type: 'object',
        fields: [
          defineField({name: 'title', type: 'titleObject'}),
          defineField({name: 'releaseType', type: 'number'}),
        ],
      }),
    ])

    expect(errorMessages(types)).toEqual([
      `The "title" field of "${RELEASE_METADATA_TYPE_NAME}" must store a string, but its type "titleObject" stores an object.`,
      `The "releaseType" field of "${RELEASE_METADATA_TYPE_NAME}" must store a string, but its type "number" stores a number.`,
    ])
  })

  test('rejects a metadata type that is not an object', () => {
    const types = resolveReleaseTypes([{name: RELEASE_METADATA_TYPE_NAME, type: 'string'}])

    expect(errorMessages(types)).toContain(
      `The "${RELEASE_METADATA_TYPE_NAME}" type must be an object type, but it is "string".`,
    )
  })

  test('reports a schema that also declares the release document type', () => {
    const types = resolveReleaseTypes([
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
    const schema = compile(resolveReleaseTypes([customMetadata]))
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
    const extracted = extractSchema(compile(resolveReleaseTypes([customMetadata, book])))
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
})

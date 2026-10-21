import {type SanityClient} from '@sanity/client'
import {Schema} from '@sanity/schema'
import {
  builtinTypes,
  createSchemaFromManifestTypes,
  extractManifestSchemaTypes,
} from '@sanity/schema/_internal'
import {type Rule, type SanityDocument, type SchemaTypeDefinition} from '@sanity/types'
import {describe, expect, it, vi} from 'vitest'

import {type DocumentValidationResult, validateDocument, validationMarkerCodes} from '../src'
import {inferFromSchema} from '../src/_internal'

const studioBuiltinSchema = inferFromSchema(Schema.compile({name: 'studio', types: builtinTypes}))

function createStudioSchema(types: SchemaTypeDefinition[]) {
  return inferFromSchema(
    Schema.compile({
      name: 'test',
      parent: studioBuiltinSchema,
      types,
    }),
  )
}

function manifestRoundTrip(types: SchemaTypeDefinition[]) {
  const source = createStudioSchema(types)
  const serialized = JSON.parse(JSON.stringify(extractManifestSchemaTypes(source))) as Array<{
    name: string
    fields?: Array<{
      name: string
      type: string
      options?: {source?: string; maxLength?: number}
      validation?: Array<{rules: Array<{flag: string}>}>
    }>
  }>
  return {
    serialized,
    schema: createSchemaFromManifestTypes({name: 'reconstructed', types: serialized}),
    source,
  }
}

function createDocument(value: Record<string, unknown>): SanityDocument {
  return {
    _createdAt: '2026-01-01T00:00:00.000Z',
    _id: 'article-id',
    _rev: 'revision',
    _type: 'article',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    ...value,
  }
}

function createClient(unique: boolean) {
  const fetch = vi.fn(async () => unique)
  const client = {fetch, withConfig: () => client} as unknown as SanityClient
  return {client, fetch}
}

function ruleFlags(
  field: {validation?: Array<{rules: Array<{flag: string}>}>} | undefined,
): string[] {
  return (field?.validation ?? []).flatMap((group) => group.rules.map((rule) => rule.flag))
}

function fieldOf(
  serialized: Awaited<ReturnType<typeof manifestRoundTrip>>['serialized'],
  fieldName: string,
) {
  return serialized
    .find((type) => type.name === 'article')
    ?.fields?.find((field) => field.name === fieldName)
}

async function validate(
  schema: ReturnType<typeof createStudioSchema>,
  document: SanityDocument,
  client: SanityClient,
): Promise<DocumentValidationResult> {
  return validateDocument({client, document, schema})
}

const articleWithSlug: SchemaTypeDefinition = {
  name: 'article',
  type: 'document',
  fields: [
    {name: 'name', type: 'string'},
    {name: 'slug', type: 'slug', options: {source: 'name', maxLength: 96}},
  ],
}

describe('manifest-deployed slug validation', () => {
  it('does not serialize built-in slug validators as bare custom rules', () => {
    const {serialized} = manifestRoundTrip([articleWithSlug])
    const slug = fieldOf(serialized, 'slug')

    expect(slug?.type).toBe('slug')
    expect(slug?.options).toEqual({source: 'name', maxLength: 96})
    expect(ruleFlags(slug)).not.toContain('custom')
  })

  it('matches studio slug validation after the schema is reconstructed from a manifest', async () => {
    const {schema, source} = manifestRoundTrip([articleWithSlug])
    const {client, fetch} = createClient(true)
    const unique = createDocument({name: 'Hello', slug: {_type: 'slug', current: 'hello'}})

    await expect(validate(schema, unique, client)).resolves.toEqual(
      await validate(source, unique, client),
    )
    expect(fetch).toHaveBeenCalled()

    const duplicateClient = createClient(false)
    const duplicate = await validate(schema, unique, duplicateClient.client)
    expect(duplicate).toEqual(await validate(source, unique, duplicateClient.client))
    expect(duplicate.markers).toEqual([
      expect.objectContaining({code: validationMarkerCodes.slugNotUnique, path: ['slug']}),
    ])

    const missingCurrent = createDocument({name: 'Hello', slug: {_type: 'slug', current: '  '}})
    const missing = await validate(schema, missingCurrent, client)
    expect(missing).toEqual(await validate(source, missingCurrent, client))
    expect(missing.markers).toEqual([
      expect.objectContaining({code: validationMarkerCodes.slugMissingCurrent, path: ['slug']}),
    ])

    const empty = createDocument({name: 'Hello'})
    await expect(validate(schema, empty, client)).resolves.toEqual(
      await validate(source, empty, client),
    )
  })

  it('still reports an authored custom validator that the manifest cannot carry', async () => {
    const {serialized, schema, source} = manifestRoundTrip([
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'title',
            type: 'string',
            validation: (rule: Rule) => rule.custom(() => 'Title is not allowed'),
          },
          {name: 'slug', type: 'slug'},
        ],
      },
    ])

    expect(ruleFlags(fieldOf(serialized, 'title'))).toContain('custom')
    expect(ruleFlags(fieldOf(serialized, 'slug'))).not.toContain('custom')

    const {client} = createClient(true)
    const document = createDocument({title: 'Hello', slug: {_type: 'slug', current: 'hello'}})
    const manifest = await validate(schema, document, client)
    const studio = await validate(source, document, client)

    expect(studio.markers).toEqual([
      expect.objectContaining({
        code: validationMarkerCodes.custom,
        message: 'Title is not allowed',
        path: ['title'],
      }),
    ])
    expect(manifest.markers).toEqual([
      expect.objectContaining({
        code: validationMarkerCodes.validationException,
        path: ['title'],
      }),
    ])
    expect(manifest.markers).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: validationMarkerCodes.validationException,
          path: ['slug'],
        }),
      ]),
    )
  })

  it('keeps an authored slug rule together with the built-in checks', async () => {
    const {schema, source} = manifestRoundTrip([
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'slug',
            type: 'slug',
            validation: (rule: Rule) => rule.required(),
          },
        ],
      },
    ])
    const {client, fetch} = createClient(true)
    const empty = createDocument({})
    const missing = await validate(schema, empty, client)

    expect(missing).toEqual(await validate(source, empty, client))
    expect(missing.markers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({code: validationMarkerCodes.valueRequired, path: ['slug']}),
      ]),
    )
    expect(fetch).not.toHaveBeenCalled()

    const filled = createDocument({slug: {_type: 'slug', current: 'hello'}})
    await expect(validate(schema, filled, client)).resolves.toEqual(
      await validate(source, filled, client),
    )
    expect(fetch).toHaveBeenCalled()
  })
})

import {SanityClient} from '@sanity/client'
import {convertToDefinition, type SchemaSummary} from '@sanity/schema-descriptor-utils'
import {
  createSchemaFromManifestTypes,
  DescriptorConverter,
  extractManifestSchemaTypes,
} from '@sanity/schema/_internal'
import {type Rule, type SchemaTypeDefinition} from '@sanity/types'
import {validateDocument, validationMarkerCodes} from '@sanity/validation'
import {inferFromSchema} from '@sanity/validation/_internal'
import {describe, expect, it, vi} from 'vitest'

import {createSchema} from '../../src/core/schema/createSchema'

const document = {
  _id: 'article-id',
  _type: 'article',
  _rev: 'revision',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
}

async function roundtrip(types: SchemaTypeDefinition[], format: 'manifest' | 'descriptor') {
  const source = createSchema({name: 'source', types})
  let manifestTypes: unknown[]
  if (format === 'manifest') {
    manifestTypes = extractManifestSchemaTypes(source)
  } else {
    const descriptor = await new DescriptorConverter().get(source)
    const localNames = source.getLocalTypeNames()
    const values = Object.values(descriptor.objectValues)
    // Simulate the JSON schema summary returned by the descriptors API, including hoisted fields.
    const summary: SchemaSummary = JSON.parse(
      JSON.stringify({
        types: Object.fromEntries(
          values
            .filter(
              (value) =>
                value.type === 'sanity.schema.namedType' &&
                typeof value.name === 'string' &&
                localNames.includes(value.name),
            )
            .map((value) => [value.name, value.typeDef]),
        ),
        hoisted: Object.fromEntries(
          values
            .filter((value) => value.type === 'sanity.schema.hoisted')
            .map((value) => [value.key, value.value]),
        ),
        registries: [],
      }),
    )
    manifestTypes = convertToDefinition(summary, {format: 'manifest'}).types
  }
  return inferFromSchema(
    createSchemaFromManifestTypes({
      name: 'reconstructed',
      types: JSON.parse(JSON.stringify(manifestTypes)),
    }),
  )
}

function createValidationClient() {
  const request = vi.fn(async () => ({result: true}))
  const client = new SanityClient(request, {
    projectId: 'test',
    dataset: 'production',
    apiVersion: '2025-02-19',
    useCdn: false,
  })
  return {client, request}
}

describe.each(['manifest', 'descriptor'] as const)('%s validation roundtrip', (format) => {
  it.each([
    {type: 'email', value: 'invalid', code: validationMarkerCodes.stringEmail},
    {type: 'url', value: 'invalid', code: validationMarkerCodes.stringUrlInvalid},
    {type: 'date', value: 'invalid', code: validationMarkerCodes.dateInvalidFormat},
    {type: 'datetime', value: 'invalid', code: validationMarkerCodes.dateInvalidFormat},
  ])('retains $type validation with custom callbacks disabled', async ({type, value, code}) => {
    const schema = await roundtrip(
      [
        {name: 'alias', type},
        {name: 'article', type: 'document', fields: [{name: 'value', type: 'alias'}]},
      ],
      format,
    )
    const result = await validateDocument({schema, document: {...document, value}})
    expect(result.complete).toBe(true)
    expect(result.markers).toEqual([expect.objectContaining({code, path: ['value']})])
  })

  it.each(['slug', 'customSlug', 'nestedSlug'])(
    'restores built-in %s validation without unavailable custom callbacks',
    async (type) => {
      const schema = await roundtrip(
        [
          {name: 'customSlug', type: 'slug'},
          {name: 'nestedSlug', type: 'customSlug'},
          {
            name: 'article',
            type: 'document',
            fields: [{name: 'slug', type, validation: (rule: Rule) => rule.required()}],
          },
        ],
        format,
      )
      const {client, request} = createValidationClient()

      // Both managed Studios and headless callers must retain the built-in checks.
      await Promise.all(
        [false, true].map((customValidation) =>
          expect(
            validateDocument({
              schema,
              client,
              customValidation,
              document: {...document, slug: {_type: type, current: 'hello'}},
            }),
          ).resolves.toEqual({status: 'passed', complete: true, markers: []}),
        ),
      )
      expect(request).toHaveBeenCalledTimes(2)

      request.mockResolvedValue({result: false})
      const duplicate = await validateDocument({
        schema,
        client,
        customValidation: false,
        document: {...document, slug: {_type: type, current: 'hello'}},
      })
      expect(duplicate.markers).toEqual([
        expect.objectContaining({code: validationMarkerCodes.slugNotUnique, path: ['slug']}),
      ])

      const malformed = await validateDocument({
        schema,
        document: {...document, slug: {_type: type, current: ' '}},
      })
      expect(malformed.markers).toContainEqual(
        expect.objectContaining({code: validationMarkerCodes.slugMissingCurrent, path: ['slug']}),
      )

      const missing = await validateDocument({schema, document})
      expect(missing.markers).toContainEqual(
        expect.objectContaining({code: validationMarkerCodes.valueRequired, path: ['slug']}),
      )
    },
  )

  it('restores optional slug rules inside nested array members', async () => {
    const schema = await roundtrip(
      [
        {
          name: 'article',
          type: 'document',
          fields: [
            {name: 'slug', type: 'slug'},
            {
              name: 'sections',
              type: 'array',
              of: [{type: 'object', fields: [{name: 'slug', type: 'slug'}]}],
            },
          ],
        },
      ],
      format,
    )
    await expect(validateDocument({schema, document})).resolves.toEqual({
      status: 'passed',
      complete: true,
      markers: [],
    })
    const result = await validateDocument({
      schema,
      document: {...document, sections: [{_key: 'section', slug: {current: ' '}}]},
    })
    expect(result.markers).toContainEqual(
      expect.objectContaining({
        code: validationMarkerCodes.slugMissingCurrent,
        path: ['sections', {_key: 'section'}, 'slug'],
      }),
    )
  })

  it('keeps unavailable user-authored validators visible to callers', async () => {
    const schema = await roundtrip(
      [
        {
          name: 'article',
          type: 'document',
          fields: [
            {name: 'slug', type: 'slug', validation: (rule: Rule) => rule.custom(() => true)},
          ],
        },
      ],
      format,
    )
    const options = {schema, document: {...document, slug: {current: 'hello'}}}
    const {client} = createValidationClient()
    await expect(validateDocument({...options, client, customValidation: false})).resolves.toEqual({
      status: 'notEvaluated',
      complete: false,
      markers: [],
    })
    const result = await validateDocument({...options, client})
    expect(result.complete).toBe(false)
    expect(result.markers).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('reconstructed from a serialized schema manifest'),
        path: ['slug'],
      }),
    ])
  })
})

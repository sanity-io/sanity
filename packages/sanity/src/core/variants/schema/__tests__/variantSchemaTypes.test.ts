import {extractManifestSchemaTypes, extractSchema} from '@sanity/schema/_internal'
import {defineField, isArraySchemaType, isObjectSchemaType} from '@sanity/types'
import {validateDocument} from '@sanity/validation'
import {describe, expect, it, vi} from 'vitest'

import {
  getMockSource,
  type MockWorkspaceOptions,
} from '../../../../../test/testUtils/getMockWorkspaceFromConfig'
import {type DocumentActionComponent} from '../../../config/document/actions'
import {type Source, type VariantMetadataConfig} from '../../../config/types'
import {getSearchableOmnisearchTypes} from '../../../studio/components/navbar/search/utils/selectors'
import {VARIANT_DOCUMENT_TYPE} from '../../store/constants'
import {VARIANT_METADATA_TYPE_NAME, variantMetadataSchema} from '../variantMetadata'

const CORE_FIELD_NAMES = ['title', 'description', 'type']

const owner = defineField({name: 'owner', title: 'Owner', type: 'string'})
const expiresAt = defineField({name: 'expiresAt', title: 'Expires at', type: 'datetime'})

function withVariants(
  metadata?: VariantMetadataConfig,
  config: MockWorkspaceOptions['config'] = {},
): MockWorkspaceOptions {
  return {config: {...config, beta: {variants: {enabled: true, metadata}}}}
}

function metadataType(source: Source) {
  const type = source.schema.get(VARIANT_METADATA_TYPE_NAME)
  if (!isObjectSchemaType(type)) throw new Error('Expected sanity.variantMetadata to be an object')
  return type
}

function fieldNames(source: Source): string[] {
  return metadataType(source).fields.map((field) => field.name)
}

describe('variant schema types from the variants plugin', () => {
  it('adds the variant document and its metadata with only the core fields by default', async () => {
    const source = await getMockSource(withVariants())

    const variant = source.schema.get(VARIANT_DOCUMENT_TYPE)
    expect(variant?.type?.name).toBe('document')
    const metadataField = isObjectSchemaType(variant)
      ? variant.fields.find((field) => field.name === 'metadata')
      : undefined
    expect(metadataField?.type.name).toBe(VARIANT_METADATA_TYPE_NAME)
    expect(fieldNames(source)).toEqual(CORE_FIELD_NAMES)

    const conditionsType = isObjectSchemaType(variant)
      ? variant.fields.find((field) => field.name === 'conditions')?.type
      : undefined
    if (!isArraySchemaType(conditionsType)) throw new Error('Expected conditions to be an array')
    expect(
      conditionsType.of.map((member) =>
        isObjectSchemaType(member) ? member.fields.map((field) => field.name) : [],
      ),
    ).toEqual([['condition', 'value']])
  })

  it('leaves both types out when variants are disabled', async () => {
    const source = await getMockSource()

    expect(source.schema.get(VARIANT_DOCUMENT_TYPE)).toBeUndefined()
    expect(source.schema.get(VARIANT_METADATA_TYPE_NAME)).toBeUndefined()
  })

  it('adds the fields, fieldsets and groups of plugins and the root config after the core fields', async () => {
    const source = await getMockSource(
      withVariants(
        {
          groups: [{name: 'ownership', title: 'Ownership'}],
          fields: [{...owner, group: 'ownership'}],
        },
        {
          plugins: [
            {
              name: 'lifecycle-plugin',
              beta: {
                variants: {
                  metadata: {
                    fieldsets: [{name: 'lifecycle', title: 'Lifecycle'}],
                    fields: [{...expiresAt, fieldset: 'lifecycle'}],
                  },
                },
              },
            },
          ],
        },
      ),
    )

    const type = metadataType(source)
    expect(fieldNames(source)).toEqual([...CORE_FIELD_NAMES, 'expiresAt', 'owner'])
    expect(
      type.fieldsets?.some((fieldset) => !fieldset.single && fieldset.name === 'lifecycle'),
    ).toBe(true)
    expect(type.groups?.map((group) => group.name)).toContain('ownership')
    expect(source.beta?.variants?.metadata?.fields?.map((field) => field.name)).toEqual([
      'expiresAt',
      'owner',
    ])
  })

  it('warns when two plugins define the same field, and keeps the later one', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const source = await getMockSource(
      withVariants(undefined, {
        plugins: [
          {name: 'first-plugin', beta: {variants: {metadata: {fields: [owner]}}}},
          {
            name: 'second-plugin',
            beta: {variants: {metadata: {fields: [{...owner, title: 'Team'}]}}},
          },
        ],
      }),
    )

    expect(fieldNames(source)).toEqual([...CORE_FIELD_NAMES, 'owner'])
    expect(metadataType(source).fields.at(-1)?.type.title).toBe('Team')
    expect(warn).toHaveBeenCalledWith(
      '[beta.variants.metadata.fields] Field "owner" from plugin "second-plugin" replaces the one from plugin "first-plugin"',
    )
    warn.mockRestore()
  })

  it('keeps the core fields when a configured field reuses a core field name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const source = await getMockSource(
      withVariants({fields: [defineField({name: 'title', type: 'number'}), owner]}),
    )

    expect(fieldNames(source)).toEqual([...CORE_FIELD_NAMES, 'owner'])
    expect(metadataType(source).fields[0]?.type.name).toBe('string')
    expect(warn).toHaveBeenCalledWith(
      '[beta.variants.metadata.fields] Dropped field "title": name "title" is reserved',
    )
    warn.mockRestore()
  })

  it('drops core field names when the metadata type is built from a config directly', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const definition = variantMetadataSchema({
      fields: [defineField({name: 'type', type: 'number'}), owner],
    })

    expect(definition.fields.map((field) => field.name)).toEqual([...CORE_FIELD_NAMES, 'owner'])
    expect(definition.fields.find((field) => field.name === 'type')?.type).toBe('string')
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[beta.variants.metadata.fields] Dropped field "type": name "type" is reserved',
    )
    warn.mockRestore()
  })

  it('throws when a config sets the metadata fields to something other than an array', async () => {
    const config = JSON.parse(JSON.stringify({beta: {variants: {metadata: {fields: 'owner'}}}}))

    await expect(getMockSource({config})).rejects.toThrow(
      'Expected `beta.variants.metadata.fields` to be an array, but received string',
    )
  })

  it('keeps the variant document out of templates, global search and earlier document actions', async () => {
    const workspaceAction: DocumentActionComponent = () => null
    const source = await getMockSource(
      withVariants(undefined, {
        plugins: [
          {name: 'workspace-actions', document: {actions: (prev) => [...prev, workspaceAction]}},
        ],
      }),
    )

    const templateTypes = source.templates.map((template) => template.schemaType)
    expect(templateTypes).toContain('author')
    expect(templateTypes).not.toContain(VARIANT_DOCUMENT_TYPE)

    const searchTypes = getSearchableOmnisearchTypes(source.schema).map((type) => type.name)
    expect(searchTypes).toContain('author')
    expect(searchTypes).not.toContain(VARIANT_DOCUMENT_TYPE)

    // Plugins after the variants plugin decide for themselves, like tasks adding its action
    const actions = (schemaType: string, documentId: string) =>
      source.document.actions({
        versionType: 'published',
        releaseId: undefined,
        schemaType,
        documentId,
      })
    expect(actions('author', 'someAuthor')).toContain(workspaceAction)
    expect(actions(VARIANT_DOCUMENT_TYPE, '_.variants.loyal')).not.toContain(workspaceAction)
  })

  it('validates a stored variant with the core fields and the validation of every config', async () => {
    const source = await getMockSource(
      withVariants(
        {
          fields: [owner],
          validation: (rule) =>
            rule.custom((value: {owner?: string} | undefined) =>
              value?.owner ? true : 'Add an owner',
            ),
        },
        {
          plugins: [
            {
              name: 'lifecycle-plugin',
              beta: {
                variants: {
                  metadata: {
                    fields: [expiresAt],
                    validation: (rule) =>
                      rule.custom((value: {expiresAt?: string} | undefined) =>
                        value?.expiresAt ? true : 'Add an expiry date',
                      ),
                  },
                },
              },
            },
          ],
        },
      ),
    )
    const variant = {
      _id: '_.variants.loyal',
      _type: VARIANT_DOCUMENT_TYPE,
      _createdAt: '2026-01-01T00:00:00Z',
      _updatedAt: '2026-01-01T00:00:00Z',
      _rev: 'rev',
      name: 'loyal',
      priority: 0,
      conditions: [{_key: 'audience', condition: 'audience', value: 'loyal'}],
    }

    const client = source.getClient({apiVersion: '2025-02-19'})
    const invalid = await validateDocument({
      schema: source.schema,
      client,
      document: {...variant, metadata: {_type: VARIANT_METADATA_TYPE_NAME}},
    })
    expect(invalid.markers.map((marker) => marker.message).toSorted()).toEqual([
      'Add an expiry date',
      'Add an owner',
      'Required',
    ])

    const valid = await validateDocument({
      schema: source.schema,
      client,
      document: {
        ...variant,
        metadata: {
          _type: VARIANT_METADATA_TYPE_NAME,
          title: 'Loyal customers',
          owner: 'Growth',
          expiresAt: '2026-06-01T00:00:00Z',
        },
      },
    })
    expect(valid.markers).toEqual([])
  })

  it('includes both types, with the configured fields, in the schema typegen reads', async () => {
    const source = await getMockSource(withVariants({fields: [owner]}))

    const extracted = extractSchema(source.schema)
    expect(extracted.find((type) => type.name === VARIANT_DOCUMENT_TYPE)).toMatchObject({
      type: 'document',
      attributes: {
        metadata: {value: {type: 'inline', name: VARIANT_METADATA_TYPE_NAME}},
      },
    })
    expect(extracted.find((type) => type.name === VARIANT_METADATA_TYPE_NAME)).toMatchObject({
      type: 'type',
      value: {
        type: 'object',
        attributes: {
          _type: {value: {type: 'string', value: VARIANT_METADATA_TYPE_NAME}},
          owner: {value: {type: 'string'}},
        },
      },
    })
  })

  it('includes both types, with the core and configured fields, in the schema manifest', async () => {
    const source = await getMockSource(withVariants({fields: [owner]}))

    const manifest = extractManifestSchemaTypes(source.schema)
    const variant = manifest.find((type) => type.name === VARIANT_DOCUMENT_TYPE)
    const metadata = manifest.find((type) => type.name === VARIANT_METADATA_TYPE_NAME)
    expect(variant?.type).toBe('document')
    expect(variant?.fields?.find((field) => field.name === 'metadata')?.type).toBe(
      VARIANT_METADATA_TYPE_NAME,
    )
    expect(metadata?.fields?.map((field) => field.name)).toEqual([...CORE_FIELD_NAMES, 'owner'])
  })
})

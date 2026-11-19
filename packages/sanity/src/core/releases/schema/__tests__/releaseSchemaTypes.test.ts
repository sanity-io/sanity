import {extractManifestSchemaTypes, extractSchema} from '@sanity/schema/_internal'
import {defineField, isObjectSchemaType} from '@sanity/types'
import {validateDocument} from '@sanity/validation'
import {describe, expect, it, vi} from 'vitest'

import {getMockSource} from '../../../../../test/testUtils/getMockWorkspaceFromConfig'
import {type Source} from '../../../config/types'
import {getSearchableOmnisearchTypes} from '../../../studio/components/navbar/search/utils/selectors'
import {RELEASE_DOCUMENT_TYPE_NAME} from '../release'
import {RELEASE_METADATA_TYPE_NAME} from '../releaseMetadata'

const CORE_FIELD_NAMES = ['title', 'description', 'releaseType', 'intendedPublishAt', 'cardinality']

const legalNote = defineField({name: 'legalNote', title: 'Legal note', type: 'string'})
const owner = defineField({name: 'owner', title: 'Owner', type: 'string'})

function metadataType(source: Source) {
  const type = source.schema.get(RELEASE_METADATA_TYPE_NAME)
  if (!isObjectSchemaType(type)) throw new Error('Expected sanity.releaseMetadata to be an object')
  return type
}

function fieldNames(source: Source): string[] {
  return metadataType(source).fields.map((field) => field.name)
}

describe('release schema types from the releases plugin', () => {
  it('adds the release document and its metadata with only the core fields by default', async () => {
    const source = await getMockSource()

    const release = source.schema.get(RELEASE_DOCUMENT_TYPE_NAME)
    expect(release?.type?.name).toBe('document')
    const metadataField = isObjectSchemaType(release)
      ? release.fields.find((field) => field.name === 'metadata')
      : undefined
    expect(metadataField?.type.name).toBe(RELEASE_METADATA_TYPE_NAME)
    expect(fieldNames(source)).toEqual(CORE_FIELD_NAMES)
  })

  it('adds the fields, fieldsets and groups of plugins and the root config after the core fields', async () => {
    const source = await getMockSource({
      config: {
        plugins: [
          {
            name: 'legal-plugin',
            releases: {
              metadata: {
                fieldsets: [{name: 'review', title: 'Review'}],
                fields: [{...legalNote, fieldset: 'review'}],
              },
            },
          },
        ],
        releases: {
          enabled: true,
          metadata: {
            groups: [{name: 'ownership', title: 'Ownership'}],
            fields: [{...owner, group: 'ownership'}],
          },
        },
      },
    })

    const type = metadataType(source)
    expect(fieldNames(source)).toEqual([...CORE_FIELD_NAMES, 'legalNote', 'owner'])
    expect(type.fieldsets?.some((fieldset) => !fieldset.single && fieldset.name === 'review')).toBe(
      true,
    )
    expect(type.groups?.map((group) => group.name)).toContain('ownership')
    expect(source.releases?.metadata?.fields?.map((field) => field.name)).toEqual([
      'legalNote',
      'owner',
    ])
  })

  it('drops a configured field that reuses a core field name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const source = await getMockSource({
      config: {
        releases: {
          enabled: true,
          metadata: {fields: [defineField({name: 'title', type: 'number'}), legalNote]},
        },
      },
    })

    expect(fieldNames(source)).toEqual([...CORE_FIELD_NAMES, 'legalNote'])
    expect(metadataType(source).fields[0]?.type.name).toBe('string')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Dropped field "title"'))
    warn.mockRestore()
  })

  it('leaves both types out when releases are disabled', async () => {
    const source = await getMockSource({config: {releases: {enabled: false}}})

    expect(source.schema.get(RELEASE_DOCUMENT_TYPE_NAME)).toBeUndefined()
    expect(source.schema.get(RELEASE_METADATA_TYPE_NAME)).toBeUndefined()
  })

  it('keeps the release document out of templates, document actions and global search', async () => {
    const source = await getMockSource()

    const templateTypes = source.templates.map((template) => template.schemaType)
    expect(templateTypes).toContain('author')
    expect(templateTypes).not.toContain(RELEASE_DOCUMENT_TYPE_NAME)

    const searchTypes = getSearchableOmnisearchTypes(source.schema).map((type) => type.name)
    expect(searchTypes).toContain('author')
    expect(searchTypes).not.toContain(RELEASE_DOCUMENT_TYPE_NAME)

    const context = {versionType: 'published', releaseId: undefined} as const
    expect(
      source.document.actions({...context, schemaType: 'author', documentId: 'someAuthor'}),
    ).not.toHaveLength(0)
    expect(
      source.document.actions({
        ...context,
        schemaType: RELEASE_DOCUMENT_TYPE_NAME,
        documentId: '_.releases.spring',
      }),
    ).toEqual([])
  })

  it('validates a stored release with the validation of every config', async () => {
    const source = await getMockSource({
      config: {
        plugins: [
          {
            name: 'legal-plugin',
            releases: {
              metadata: {
                fields: [legalNote],
                validation: (rule) =>
                  rule.custom((value: {legalNote?: string} | undefined) =>
                    value?.legalNote ? true : 'Add a legal note',
                  ),
              },
            },
          },
        ],
        releases: {
          enabled: true,
          metadata: {
            fields: [owner],
            validation: (rule) =>
              rule.custom((value: {owner?: string} | undefined) =>
                value?.owner ? true : 'Add an owner',
              ),
          },
        },
      },
    })
    const release = {
      _id: '_.releases.spring',
      _type: RELEASE_DOCUMENT_TYPE_NAME,
      _createdAt: '2026-01-01T00:00:00Z',
      _updatedAt: '2026-01-01T00:00:00Z',
      _rev: 'rev',
      name: 'spring',
      state: 'active',
    }

    const client = source.getClient({apiVersion: '2025-02-19'})
    const invalid = await validateDocument({
      schema: source.schema,
      client,
      document: {
        ...release,
        metadata: {_type: RELEASE_METADATA_TYPE_NAME, title: 'Spring', releaseType: 'asap'},
      },
    })
    expect(invalid.markers.map((marker) => marker.message).toSorted()).toEqual([
      'Add a legal note',
      'Add an owner',
    ])

    const valid = await validateDocument({
      schema: source.schema,
      client,
      document: {
        ...release,
        metadata: {
          _type: RELEASE_METADATA_TYPE_NAME,
          title: 'Spring',
          releaseType: 'asap',
          legalNote: 'Cleared',
          owner: 'Legal',
        },
      },
    })
    expect(valid.markers).toEqual([])
  })

  it('includes both types, with the configured fields, in the schema typegen reads', async () => {
    const source = await getMockSource({
      config: {releases: {enabled: true, metadata: {fields: [legalNote]}}},
    })

    const extracted = extractSchema(source.schema)
    expect(extracted.find((type) => type.name === RELEASE_DOCUMENT_TYPE_NAME)).toMatchObject({
      type: 'document',
      attributes: {
        metadata: {value: {type: 'inline', name: RELEASE_METADATA_TYPE_NAME}},
      },
    })
    expect(extracted.find((type) => type.name === RELEASE_METADATA_TYPE_NAME)).toMatchObject({
      type: 'type',
      value: {
        type: 'object',
        attributes: {
          _type: {value: {type: 'string', value: RELEASE_METADATA_TYPE_NAME}},
          legalNote: {value: {type: 'string'}},
        },
      },
    })
  })

  it('includes both types, with the core and configured fields, in the schema manifest', async () => {
    const source = await getMockSource({
      config: {releases: {enabled: true, metadata: {fields: [legalNote]}}},
    })

    const manifest = extractManifestSchemaTypes(source.schema)
    const release = manifest.find((type) => type.name === RELEASE_DOCUMENT_TYPE_NAME)
    const metadata = manifest.find((type) => type.name === RELEASE_METADATA_TYPE_NAME)
    expect(release?.type).toBe('document')
    expect(release?.fields?.find((field) => field.name === 'metadata')?.type).toBe(
      RELEASE_METADATA_TYPE_NAME,
    )
    expect(metadata?.fields?.map((field) => field.name)).toEqual([...CORE_FIELD_NAMES, 'legalNote'])
  })
})

import {
  convertToDefinition,
  schemaSummaryFromSetSynchronization,
} from '@sanity/schema-descriptor-utils'
import {createSchemaFromManifestTypes, DescriptorConverter} from '@sanity/schema/_internal'
import {defineField, type ObjectSchemaType, type Schema} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {defineReleaseMetadata} from '../../src/core/releases/metadata/defineReleaseMetadata'
import {createSchema} from '../../src/core/schema/createSchema'

async function extendedMetadataSummary() {
  const source = createSchema({
    name: 'source',
    types: [defineReleaseMetadata({fields: [defineField({name: 'legalReview', type: 'string'})]})],
  })
  const synchronization = await new DescriptorConverter().get(source)
  // Simulate the JSON schema summary returned by the descriptors API.
  return JSON.parse(JSON.stringify(schemaSummaryFromSetSynchronization(synchronization)))
}

function releaseMetadataFieldNames(schema: Schema) {
  const release = schema.get('system.release') as ObjectSchemaType
  const metadata = release.fields.find((field) => field.name === 'metadata')?.type
  return (metadata as ObjectSchemaType).fields.map((field) => field.name)
}

const extendedMetadataFieldNames = [
  'title',
  'description',
  'releaseType',
  'intendedPublishAt',
  'cardinality',
  'legalReview',
]

describe('rebuilding a schema with extended release metadata from its descriptor', () => {
  it('works with createSchema, although the descriptor carries the core fields', async () => {
    const summary = await extendedMetadataSummary()
    const {types} = convertToDefinition(summary, {format: 'createSchema'})
    const schema = createSchema({name: 'rebuilt', types})

    const errors = (schema._validation ?? []).flatMap((group) =>
      group.problems.filter((problem) => problem.severity === 'error'),
    )
    expect(errors).toEqual([])
    expect(releaseMetadataFieldNames(schema)).toEqual(extendedMetadataFieldNames)
  })

  it('works with createSchemaFromManifestTypes', async () => {
    const summary = await extendedMetadataSummary()
    const schema = createSchemaFromManifestTypes(convertToDefinition(summary, {format: 'manifest'}))

    expect(releaseMetadataFieldNames(schema)).toEqual(extendedMetadataFieldNames)
  })
})

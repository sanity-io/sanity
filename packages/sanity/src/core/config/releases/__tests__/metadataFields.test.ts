import {type FieldDefinition} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {type PluginOptions} from '../../types'
import {resolveReleaseMetadataFields} from '../metadataFields'

const legalReview: FieldDefinition = {
  name: 'legalReview',
  type: 'string',
  title: 'Legal review',
}

const fromPlugin: FieldDefinition = {
  name: 'fromPlugin',
  type: 'string',
  title: 'From plugin',
}

describe('resolveReleaseMetadataFields', () => {
  it('returns no fields when releases metadata is absent', () => {
    const config: PluginOptions = {name: 'root'}
    expect(resolveReleaseMetadataFields(config)).toEqual([])
  })

  it('keeps a plugin field when the root config has no releases key', () => {
    const config: PluginOptions = {
      name: 'root',
      plugins: [
        {
          name: 'plugin',
          releases: {metadata: {fields: [fromPlugin]}},
        },
      ],
    }

    expect(resolveReleaseMetadataFields(config)).toEqual([fromPlugin])
  })

  it('keeps plugin fields and root fields with different names', () => {
    const config: PluginOptions = {
      name: 'root',
      plugins: [
        {
          name: 'plugin',
          releases: {metadata: {fields: [fromPlugin]}},
        },
      ],
      releases: {metadata: {fields: [legalReview]}},
    }

    expect(resolveReleaseMetadataFields(config)).toEqual([fromPlugin, legalReview])
  })

  it('replaces an earlier field when a later config reuses its name', () => {
    const rootField: FieldDefinition = {...legalReview, title: 'Root legal review'}
    const config: PluginOptions = {
      name: 'root',
      plugins: [
        {
          name: 'plugin',
          releases: {metadata: {fields: [legalReview]}},
        },
      ],
      releases: {metadata: {fields: [rootField]}},
    }

    expect(resolveReleaseMetadataFields(config)).toEqual([rootField])
  })

  it('drops reserved names, invalid names, and entries that are not fields', () => {
    const fields = [
      {name: 'title', type: 'string'},
      {name: 'description', type: 'string'},
      {name: 'releaseType', type: 'string'},
      {name: 'intendedPublishAt', type: 'string'},
      {name: 'cardinality', type: 'string'},
      {name: 'legal-review', type: 'string'},
      {name: '1no', type: 'string'},
      {type: 'string'},
      'legalReview',
      legalReview,
    ] as FieldDefinition[]
    const config: PluginOptions = {
      name: 'root',
      releases: {
        metadata: {
          fields,
        },
      },
    }

    expect(resolveReleaseMetadataFields(config)).toEqual([legalReview])
  })

  it('throws when fields is not an array', () => {
    const config: PluginOptions = JSON.parse(
      JSON.stringify({
        name: 'root',
        releases: {metadata: {fields: 'legalReview'}},
      }),
    )

    expect(() => resolveReleaseMetadataFields(config)).toThrow(
      'Expected `releases.metadata.fields` to be an array, but received string',
    )
  })
})

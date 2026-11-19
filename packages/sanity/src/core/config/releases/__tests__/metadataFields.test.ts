import {type FieldDefinition, type ObjectRule} from '@sanity/types'
import {describe, expect, it, vi} from 'vitest'

import {type PluginOptions} from '../../types'
import {resolveReleaseMetadataConfig} from '../metadataFields'

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

describe('resolveReleaseMetadataConfig', () => {
  it('returns no fields when releases metadata is absent', () => {
    const config: PluginOptions = {name: 'root'}
    expect(resolveReleaseMetadataConfig(config)).toEqual({fields: []})
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

    expect(resolveReleaseMetadataConfig(config).fields).toEqual([fromPlugin])
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

    expect(resolveReleaseMetadataConfig(config).fields).toEqual([fromPlugin, legalReview])
  })

  it('replaces an earlier field when a later config reuses its name', () => {
    const rootField: FieldDefinition = {...legalReview, title: 'Root legal review'}
    const config: PluginOptions = {
      name: 'root',
      plugins: [
        {
          name: 'plugin',
          releases: {metadata: {fields: [legalReview, fromPlugin]}},
        },
      ],
      releases: {metadata: {fields: [rootField]}},
    }

    expect(resolveReleaseMetadataConfig(config).fields).toEqual([rootField, fromPlugin])
  })

  it('drops reserved names, invalid names, and entries that are not fields', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
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

    expect(resolveReleaseMetadataConfig(config).fields).toEqual([legalReview])
    expect(warn).toHaveBeenCalledWith(
      '[releases.metadata.fields] Dropped field "title": name "title" is reserved',
    )
    warn.mockRestore()
  })

  it('merges fieldsets and groups by name across plugins and the root config', () => {
    const config: PluginOptions = {
      name: 'root',
      plugins: [
        {
          name: 'plugin',
          releases: {
            metadata: {
              fieldsets: [
                {name: 'review', title: 'Plugin review'},
                {name: 'plugin', title: 'Plugin'},
              ],
              groups: [{name: 'legal', title: 'Plugin legal'}],
            },
          },
        },
      ],
      releases: {
        metadata: {
          fieldsets: [{name: 'review', title: 'Review'}],
          groups: [
            {name: 'legal', title: 'Legal'},
            {name: 'other', title: 'Other'},
          ],
        },
      },
    }

    const resolved = resolveReleaseMetadataConfig(config)
    expect(resolved.fieldsets).toEqual([
      {name: 'review', title: 'Review'},
      {name: 'plugin', title: 'Plugin'},
    ])
    expect(resolved.groups).toEqual([
      {name: 'legal', title: 'Legal'},
      {name: 'other', title: 'Other'},
    ])
  })

  it('keeps a single validation as it is', () => {
    const validation = (rule: ObjectRule) => rule.required()
    const config: PluginOptions = {name: 'root', releases: {metadata: {validation}}}

    expect(resolveReleaseMetadataConfig(config).validation).toBe(validation)
  })

  it('throws when fields is not an array', () => {
    const config: PluginOptions = JSON.parse(
      JSON.stringify({
        name: 'root',
        releases: {metadata: {fields: 'legalReview'}},
      }),
    )

    expect(() => resolveReleaseMetadataConfig(config)).toThrow(
      'Expected `releases.metadata.fields` to be an array, but received string',
    )
  })

  it('throws when fieldsets is not an array', () => {
    const config: PluginOptions = JSON.parse(
      JSON.stringify({
        name: 'root',
        releases: {metadata: {fieldsets: {name: 'review'}}},
      }),
    )

    expect(() => resolveReleaseMetadataConfig(config)).toThrow(
      'Expected `releases.metadata.fieldsets` to be an array, but received object',
    )
  })

  it('throws when validation is not a function', () => {
    const config: PluginOptions = JSON.parse(
      JSON.stringify({
        name: 'root',
        releases: {metadata: {validation: [{flag: 'presence'}]}},
      }),
    )

    expect(() => resolveReleaseMetadataConfig(config)).toThrow(
      'Expected `releases.metadata.validation` to be a function, but received array',
    )
  })
})

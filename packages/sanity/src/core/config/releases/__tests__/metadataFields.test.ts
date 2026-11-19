import {type FieldDefinition, type Rule} from '@sanity/types'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

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
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

  beforeEach(() => {
    warn.mockClear()
  })

  afterEach(() => {
    warn.mockClear()
  })

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

  it('keeps plugin fields and root fields with different names, without warnings', () => {
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
    expect(warn).not.toHaveBeenCalled()
  })

  it('warns when two plugins define the same field, and keeps the later one in place', () => {
    const fromSecondPlugin: FieldDefinition = {...legalReview, title: 'Second legal review'}
    const config: PluginOptions = {
      name: 'root',
      plugins: [
        {name: 'first-plugin', releases: {metadata: {fields: [legalReview, fromPlugin]}}},
        {name: 'second-plugin', releases: {metadata: {fields: [fromSecondPlugin]}}},
      ],
    }

    expect(resolveReleaseMetadataConfig(config).fields).toEqual([fromSecondPlugin, fromPlugin])
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[releases.metadata.fields] Field "legalReview" from plugin "second-plugin" replaces the one from plugin "first-plugin"',
    )
  })

  it('warns when the workspace config replaces a field from a plugin', () => {
    const rootField: FieldDefinition = {...legalReview, title: 'Root legal review'}
    const config: PluginOptions = {
      name: 'root',
      plugins: [{name: 'plugin', releases: {metadata: {fields: [legalReview]}}}],
      releases: {metadata: {fields: [rootField]}},
    }

    expect(resolveReleaseMetadataConfig(config).fields).toEqual([rootField])
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[releases.metadata.fields] Field "legalReview" from the workspace config replaces the one from plugin "plugin"',
    )
  })

  it('warns when one config lists the same field twice, and keeps the last one', () => {
    const second: FieldDefinition = {...legalReview, title: 'Second'}
    const config: PluginOptions = {
      name: 'root',
      releases: {metadata: {fields: [legalReview, second]}},
    }

    expect(resolveReleaseMetadataConfig(config).fields).toEqual([second])
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[releases.metadata.fields] Field "legalReview" is listed more than once in the workspace config, so the last one is used',
    )
  })

  it('drops invalid names and entries that are not fields, and keeps core names for the schema to drop', () => {
    const fields = [
      {name: 'title', type: 'string'},
      {name: 'legal-review', type: 'string'},
      {name: '1no', type: 'string'},
      {type: 'string'},
      'legalReview',
      legalReview,
    ] as FieldDefinition[]
    const config: PluginOptions = {name: 'root', releases: {metadata: {fields}}}

    expect(resolveReleaseMetadataConfig(config).fields.map((field) => field.name)).toEqual([
      'title',
      'legalReview',
    ])
    expect(warn).toHaveBeenCalledWith(
      '[releases.metadata.fields] Dropped field "legal-review": name "legal-review" is not a valid field name',
    )
  })

  it('merges fieldsets and groups by name, and warns about the ones it replaces', () => {
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
    expect(warn).toHaveBeenCalledWith(
      '[releases.metadata.fieldsets] Fieldset "review" from the workspace config replaces the one from plugin "plugin"',
    )
    expect(warn).toHaveBeenCalledWith(
      '[releases.metadata.groups] Group "legal" from the workspace config replaces the one from plugin "plugin"',
    )
  })

  it('keeps a single validation as it is', () => {
    const validation = (rule: Rule) => rule.required()
    const config: PluginOptions = {name: 'root', releases: {metadata: {validation}}}

    expect(resolveReleaseMetadataConfig(config).validation).toBe(validation)
  })

  it('lists the validation of every config, in order', () => {
    const fromPluginRule = (rule: Rule) => rule.required()
    const fromRootRules = [(rule: Rule) => rule.custom(() => true)]
    const config: PluginOptions = {
      name: 'root',
      plugins: [{name: 'plugin', releases: {metadata: {validation: fromPluginRule}}}],
      releases: {metadata: {validation: fromRootRules}},
    }

    expect(resolveReleaseMetadataConfig(config).validation).toEqual([fromPluginRule, fromRootRules])
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
})

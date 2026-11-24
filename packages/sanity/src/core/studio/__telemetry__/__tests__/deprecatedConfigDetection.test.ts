import {defineField, defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {type WorkspaceOptions} from '../../../config/types'
import {createSchema} from '../../../schema/createSchema'
import {
  createEmptyDeprecatedConfigFlags,
  detectDeprecatedPresentationOptions,
  detectDeprecatedRawConfigOptions,
  detectDeprecatedSchemaOptions,
} from '../deprecatedConfigDetection'

const buildArrayMemberSchema = (options?: Record<string, unknown>) =>
  createSchema({
    name: 'test',
    types: [
      defineType({
        name: 'testDoc',
        type: 'document',
        fields: [
          defineField({
            name: 'items',
            type: 'array',
            of: [
              {
                type: 'object',
                name: 'item',
                fields: [
                  defineField({name: 'tags', type: 'array', of: [{type: 'string'}], options}),
                ],
              },
            ],
          }),
        ],
      }),
    ],
  })

describe('deprecatedConfigDetection', () => {
  describe('createEmptyDeprecatedConfigFlags', () => {
    it('returns all flags as false', () => {
      const flags = createEmptyDeprecatedConfigFlags()
      expect(flags.deprecatedWorkspaceLogo).toBe(false)
      expect(flags.deprecatedStudioComponentsLogo).toBe(false)
      expect(flags.deprecatedPresentationPreviewModeCheck).toBe(false)
      expect(flags.deprecatedPresentationPreviewModeDisable).toBe(false)
      expect(flags.deprecatedArrayOptionsDirection).toBe(false)
    })
  })

  describe('detectDeprecatedRawConfigOptions', () => {
    it('detects deprecated workspace logo', () => {
      const config = {
        projectId: 'test',
        dataset: 'test',
        name: 'test',
        basePath: '/',
        logo: () => null,
      } as unknown as WorkspaceOptions

      const flags = detectDeprecatedRawConfigOptions(config)
      expect(flags.deprecatedWorkspaceLogo).toBe(true)
    })

    it('detects deprecated studio.components.logo in plugins', () => {
      const config = {
        projectId: 'test',
        dataset: 'test',
        name: 'test',
        basePath: '/',
        plugins: [
          {
            name: 'test-plugin',
            studio: {
              components: {
                logo: () => null,
              },
            },
          },
        ],
      } as unknown as WorkspaceOptions

      const flags = detectDeprecatedRawConfigOptions(config)
      expect(flags.deprecatedStudioComponentsLogo).toBe(true)
    })

    it('returns no flags for config without deprecated options', () => {
      const config = {
        projectId: 'test',
        dataset: 'test',
        name: 'test',
        basePath: '/',
      } as unknown as WorkspaceOptions

      const flags = detectDeprecatedRawConfigOptions(config)
      expect(flags.deprecatedWorkspaceLogo).toBeUndefined()
      expect(flags.deprecatedStudioComponentsLogo).toBeUndefined()
    })
  })

  describe('detectDeprecatedPresentationOptions', () => {
    it('detects deprecated previewMode.check', () => {
      const tools = [
        {
          name: 'presentation',
          options: {
            previewUrl: {
              previewMode: {
                enable: '/api/preview',
                check: '/api/check-preview',
              },
            },
          },
        },
      ]

      const flags = detectDeprecatedPresentationOptions(tools)
      expect(flags.deprecatedPresentationPreviewModeCheck).toBe(true)
    })

    it('detects deprecated previewMode.disable', () => {
      const tools = [
        {
          name: 'presentation',
          options: {
            previewUrl: {
              previewMode: {
                enable: '/api/preview',
                disable: '/api/disable-preview',
              },
            },
          },
        },
      ]

      const flags = detectDeprecatedPresentationOptions(tools)
      expect(flags.deprecatedPresentationPreviewModeDisable).toBe(true)
    })

    it('returns empty flags for tools without deprecated options', () => {
      const tools = [
        {
          name: 'presentation',
          options: {
            previewUrl: '/preview',
          },
        },
      ]

      const flags = detectDeprecatedPresentationOptions(tools)
      expect(Object.keys(flags).length).toBe(0)
    })

    it('handles tools without options', () => {
      const tools = [{name: 'desk'}]
      const flags = detectDeprecatedPresentationOptions(tools)
      expect(Object.keys(flags).length).toBe(0)
    })

    it('handles undefined tools', () => {
      const flags = detectDeprecatedPresentationOptions(undefined)
      expect(Object.keys(flags).length).toBe(0)
    })

    it('handles non-array tools', () => {
      const flags = detectDeprecatedPresentationOptions(null as unknown as undefined)
      expect(Object.keys(flags).length).toBe(0)
    })
  })

  describe('detectDeprecatedSchemaOptions', () => {
    it('detects deprecated array direction option', () => {
      const mockSchema = {
        getTypeNames: () => ['testDoc'],
        get: (name: string) => {
          if (name === 'testDoc') {
            return {
              type: {name: 'document'},
              fields: [
                {
                  type: {
                    name: 'array',
                    options: {direction: 'horizontal'},
                    of: [],
                  },
                },
              ],
            }
          }
          return undefined
        },
      } as unknown as Parameters<typeof detectDeprecatedSchemaOptions>[0]

      const flags = detectDeprecatedSchemaOptions(mockSchema)
      expect(flags.deprecatedArrayOptionsDirection).toBe(true)
    })

    it('returns empty flags for schema without deprecated options', () => {
      const mockSchema = {
        getTypeNames: () => ['testDoc'],
        get: (name: string) => {
          if (name === 'testDoc') {
            return {
              type: {name: 'document'},
              fields: [
                {
                  type: {
                    name: 'string',
                  },
                },
              ],
            }
          }
          return undefined
        },
      } as unknown as Parameters<typeof detectDeprecatedSchemaOptions>[0]

      const flags = detectDeprecatedSchemaOptions(mockSchema)
      expect(Object.keys(flags).length).toBe(0)
    })

    it('handles undefined schema', () => {
      const flags = detectDeprecatedSchemaOptions(undefined)
      expect(Object.keys(flags).length).toBe(0)
    })

    it('handles null schema', () => {
      const flags = detectDeprecatedSchemaOptions(null)
      expect(Object.keys(flags).length).toBe(0)
    })

    it('handles schema without required methods', () => {
      const flags = detectDeprecatedSchemaOptions(
        {} as unknown as Parameters<typeof detectDeprecatedSchemaOptions>[0],
      )
      expect(Object.keys(flags).length).toBe(0)
    })

    it('detects deprecated array direction in nested object fields', () => {
      const mockSchema = {
        getTypeNames: () => ['testDoc'],
        get: (name: string) => {
          if (name === 'testDoc') {
            return {
              type: {name: 'document'},
              fields: [
                {
                  type: {
                    name: 'object',
                    fields: [
                      {
                        type: {
                          name: 'array',
                          options: {direction: 'horizontal'},
                          of: [],
                        },
                      },
                    ],
                  },
                },
              ],
            }
          }
          return undefined
        },
      } as unknown as Parameters<typeof detectDeprecatedSchemaOptions>[0]

      const flags = detectDeprecatedSchemaOptions(mockSchema)
      expect(flags.deprecatedArrayOptionsDirection).toBe(true)
    })

    describe('array members', () => {
      it('detects deprecated array direction in object members', () => {
        const flags = detectDeprecatedSchemaOptions(buildArrayMemberSchema({direction: 'vertical'}))
        expect(flags.deprecatedArrayOptionsDirection).toBe(true)
      })

      it('returns no flags for object members without deprecated options', () => {
        expect(Object.keys(detectDeprecatedSchemaOptions(buildArrayMemberSchema()))).toEqual([])
      })
    })
  })
})

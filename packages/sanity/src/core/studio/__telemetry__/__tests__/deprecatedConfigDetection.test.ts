import {describe, expect, it, beforeEach} from 'vitest'

import {type WorkspaceOptions} from '../../../config/types'
import {_resetLegacyThemeDeprecatedFlags} from '../../../theme/_legacy/theme'
import {
  createEmptyDeprecatedConfigFlags,
  detectDeprecatedLegacyThemeOptions,
  detectDeprecatedPresentationOptions,
  detectDeprecatedRawConfigOptions,
  detectDeprecatedSchemaOptions,
  detectDeprecatedThemeOptions,
} from '../deprecatedConfigDetection'

describe('deprecatedConfigDetection', () => {
  beforeEach(() => {
    _resetLegacyThemeDeprecatedFlags()
  })

  describe('createEmptyDeprecatedConfigFlags', () => {
    it('returns all flags as false', () => {
      const flags = createEmptyDeprecatedConfigFlags()
      expect(flags.deprecatedWorkspaceLogo).toBe(false)
      expect(flags.deprecatedStudioComponentsLogo).toBe(false)
      expect(flags.deprecatedScheduledPublishingShowReleasesBanner).toBe(false)
      expect(flags.deprecatedBetaFormEnhancedObjectDialog).toBe(false)
      expect(flags.deprecatedBetaCreate).toBe(false)
      expect(flags.deprecatedThemeAvatar).toBe(false)
      expect(flags.deprecatedThemeButton).toBe(false)
      expect(flags.deprecatedThemeContainer).toBe(false)
      expect(flags.deprecatedThemeFocusRing).toBe(false)
      expect(flags.deprecatedThemeInput).toBe(false)
      expect(flags.deprecatedThemeLayer).toBe(false)
      expect(flags.deprecatedThemeMedia).toBe(false)
      expect(flags.deprecatedThemeRadius).toBe(false)
      expect(flags.deprecatedThemeShadows).toBe(false)
      expect(flags.deprecatedThemeSpace).toBe(false)
      expect(flags.deprecatedThemeStyles).toBe(false)
      expect(flags.deprecatedLegacyThemeScreenMediumBreak).toBe(false)
      expect(flags.deprecatedLegacyThemeScreenDefaultBreak).toBe(false)
      expect(flags.deprecatedLegacyThemeScreenLargeBreak).toBe(false)
      expect(flags.deprecatedLegacyThemeScreenXlargeBreak).toBe(false)
      expect(flags.deprecatedPresentationPreviewModeCheck).toBe(false)
      expect(flags.deprecatedPresentationPreviewModeDisable).toBe(false)
      expect(flags.deprecatedPresentationUnstableShowUnsafeShareUrl).toBe(false)
      expect(flags.deprecatedArrayOptionsDirection).toBe(false)
      expect(flags.deprecatedArrayOptionsTreeEditing).toBe(false)
      expect(flags.deprecatedCrossDatasetReferenceExperimentalSearch).toBe(false)
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

    it('detects deprecated beta.form.enhancedObjectDialog', () => {
      const config = {
        projectId: 'test',
        dataset: 'test',
        name: 'test',
        basePath: '/',
        beta: {
          form: {
            enhancedObjectDialog: true,
          },
        },
      } as unknown as WorkspaceOptions

      const flags = detectDeprecatedRawConfigOptions(config)
      expect(flags.deprecatedBetaFormEnhancedObjectDialog).toBe(true)
    })

    it('detects deprecated beta.create', () => {
      const config = {
        projectId: 'test',
        dataset: 'test',
        name: 'test',
        basePath: '/',
        beta: {
          create: {},
        },
      } as unknown as WorkspaceOptions

      const flags = detectDeprecatedRawConfigOptions(config)
      expect(flags.deprecatedBetaCreate).toBe(true)
    })

    it('detects deprecated scheduledPublishing.showReleasesBanner', () => {
      const config = {
        projectId: 'test',
        dataset: 'test',
        name: 'test',
        basePath: '/',
        scheduledPublishing: {
          showReleasesBanner: false,
        },
      } as unknown as WorkspaceOptions

      const flags = detectDeprecatedRawConfigOptions(config)
      expect(flags.deprecatedScheduledPublishingShowReleasesBanner).toBe(true)
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
      expect(flags.deprecatedBetaFormEnhancedObjectDialog).toBeUndefined()
      expect(flags.deprecatedBetaCreate).toBeUndefined()
    })
  })

  describe('detectDeprecatedThemeOptions', () => {
    it('detects deprecated avatar option', () => {
      const theme = {avatar: {}}
      const flags = detectDeprecatedThemeOptions(theme)
      expect(flags.deprecatedThemeAvatar).toBe(true)
    })

    it('detects deprecated button option', () => {
      const theme = {button: {}}
      const flags = detectDeprecatedThemeOptions(theme)
      expect(flags.deprecatedThemeButton).toBe(true)
    })

    it('detects deprecated container option', () => {
      const theme = {container: []}
      const flags = detectDeprecatedThemeOptions(theme)
      expect(flags.deprecatedThemeContainer).toBe(true)
    })

    it('detects deprecated focusRing option', () => {
      const theme = {focusRing: {}}
      const flags = detectDeprecatedThemeOptions(theme)
      expect(flags.deprecatedThemeFocusRing).toBe(true)
    })

    it('detects deprecated input option', () => {
      const theme = {input: {}}
      const flags = detectDeprecatedThemeOptions(theme)
      expect(flags.deprecatedThemeInput).toBe(true)
    })

    it('detects deprecated layer option', () => {
      const theme = {layer: {}}
      const flags = detectDeprecatedThemeOptions(theme)
      expect(flags.deprecatedThemeLayer).toBe(true)
    })

    it('detects deprecated media option', () => {
      const theme = {media: []}
      const flags = detectDeprecatedThemeOptions(theme)
      expect(flags.deprecatedThemeMedia).toBe(true)
    })

    it('detects deprecated radius option', () => {
      const theme = {radius: []}
      const flags = detectDeprecatedThemeOptions(theme)
      expect(flags.deprecatedThemeRadius).toBe(true)
    })

    it('detects deprecated shadows option', () => {
      const theme = {shadows: []}
      const flags = detectDeprecatedThemeOptions(theme)
      expect(flags.deprecatedThemeShadows).toBe(true)
    })

    it('detects deprecated space option', () => {
      const theme = {space: []}
      const flags = detectDeprecatedThemeOptions(theme)
      expect(flags.deprecatedThemeSpace).toBe(true)
    })

    it('detects deprecated styles option', () => {
      const theme = {styles: {}}
      const flags = detectDeprecatedThemeOptions(theme)
      expect(flags.deprecatedThemeStyles).toBe(true)
    })

    it('returns empty flags for valid theme without deprecated options', () => {
      const theme = {color: {}, fonts: {}}
      const flags = detectDeprecatedThemeOptions(theme)
      expect(Object.keys(flags).length).toBe(0)
    })

    it('handles non-object input', () => {
      expect(detectDeprecatedThemeOptions(null)).toEqual({})
      expect(detectDeprecatedThemeOptions(undefined)).toEqual({})
      expect(detectDeprecatedThemeOptions('string')).toEqual({})
      expect(detectDeprecatedThemeOptions(123)).toEqual({})
    })
  })

  describe('detectDeprecatedLegacyThemeOptions', () => {
    it('returns empty flags when buildLegacyTheme has not been called', () => {
      const flags = detectDeprecatedLegacyThemeOptions()
      expect(flags.deprecatedLegacyThemeScreenMediumBreak).toBeUndefined()
      expect(flags.deprecatedLegacyThemeScreenDefaultBreak).toBeUndefined()
      expect(flags.deprecatedLegacyThemeScreenLargeBreak).toBeUndefined()
      expect(flags.deprecatedLegacyThemeScreenXlargeBreak).toBeUndefined()
    })
  })

  describe('detectDeprecatedPresentationOptions', () => {
    it('detects deprecated unstable_showUnsafeShareUrl', () => {
      const tools = [
        {
          name: 'presentation',
          options: {
            unstable_showUnsafeShareUrl: true,
          },
        },
      ]

      const flags = detectDeprecatedPresentationOptions(tools)
      expect(flags.deprecatedPresentationUnstableShowUnsafeShareUrl).toBe(true)
    })

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

    it('detects deprecated array treeEditing option', () => {
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
                    options: {treeEditing: true},
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
      expect(flags.deprecatedArrayOptionsTreeEditing).toBe(true)
    })

    it('detects deprecated cross-dataset reference __experimental_search', () => {
      const mockSchema = {
        getTypeNames: () => ['testDoc'],
        get: (name: string) => {
          if (name === 'testDoc') {
            return {
              type: {name: 'document'},
              fields: [
                {
                  type: {
                    name: 'crossDatasetReference',
                    to: [{__experimental_search: []}],
                  },
                },
              ],
            }
          }
          return undefined
        },
      } as unknown as Parameters<typeof detectDeprecatedSchemaOptions>[0]

      const flags = detectDeprecatedSchemaOptions(mockSchema)
      expect(flags.deprecatedCrossDatasetReferenceExperimentalSearch).toBe(true)
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
  })
})

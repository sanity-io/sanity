import {describe, expect, it, vi} from 'vitest'

import {generateStudioManifest, type GenerateStudioManifestOptions} from '../generateStudioManifest'
import {type ManifestWorkspaceInput} from '../types'

describe('generateStudioManifest', () => {
  /**
   * Helper to create a mock workspace input
   */
  function createMockWorkspace(
    overrides: Partial<ManifestWorkspaceInput> = {},
  ): ManifestWorkspaceInput {
    return {
      name: overrides.name ?? 'default',
      projectId: overrides.projectId ?? 'test-project',
      dataset: overrides.dataset ?? 'production',
      basePath: overrides.basePath ?? '/',
      title: overrides.title ?? 'Test Workspace',
      subtitle: overrides.subtitle,
      icon: overrides.icon ?? null,
      mediaLibrary: overrides.mediaLibrary,
    }
  }

  describe('basic manifest generation', () => {
    it('should generate a manifest with workspaces', async () => {
      const workspace = createMockWorkspace()
      const options: GenerateStudioManifestOptions<ManifestWorkspaceInput> = {
        workspaces: [workspace],
        resolveSchemaDescriptorId: () => 'schema-123',
        resolveIcon: () => '<svg>icon</svg>',
        bundleVersion: '3.0.0',
      }

      const result = await generateStudioManifest(options)

      expect(result).toEqual({
        buildId: undefined,
        bundleVersion: '3.0.0',
        workspaces: [
          {
            name: 'default',
            projectId: 'test-project',
            dataset: 'production',
            schemaDescriptorId: 'schema-123',
            basePath: '/',
            title: 'Test Workspace',
            subtitle: undefined,
            icon: '<svg>icon</svg>',
            mediaLibraryId: undefined,
          },
        ],
      })
    })

    it('should include buildId when provided', async () => {
      const options: GenerateStudioManifestOptions<ManifestWorkspaceInput> = {
        workspaces: [createMockWorkspace()],
        resolveSchemaDescriptorId: () => 'schema-123',
        resolveIcon: () => undefined,
        bundleVersion: '3.0.0',
        buildId: 'build-abc',
      }

      const result = await generateStudioManifest(options)

      expect(result.buildId).toBe('build-abc')
    })
  })

  describe('workspace filtering', () => {
    it('should filter out workspaces without schemaDescriptorId', async () => {
      const workspace1 = createMockWorkspace({name: 'with-schema'})
      const workspace2 = createMockWorkspace({name: 'without-schema'})

      const options: GenerateStudioManifestOptions<ManifestWorkspaceInput> = {
        workspaces: [workspace1, workspace2],
        resolveSchemaDescriptorId: (ws) => (ws.name === 'with-schema' ? 'schema-123' : undefined),
        resolveIcon: () => undefined,
        bundleVersion: '3.0.0',
      }

      const result = await generateStudioManifest(options)

      expect(result.workspaces).toHaveLength(1)
      expect(result.workspaces[0].name).toBe('with-schema')
    })

    it('should return empty workspaces array when all workspaces are filtered', async () => {
      const options: GenerateStudioManifestOptions<ManifestWorkspaceInput> = {
        workspaces: [createMockWorkspace()],
        resolveSchemaDescriptorId: () => undefined,
        resolveIcon: () => undefined,
        bundleVersion: '3.0.0',
      }

      const result = await generateStudioManifest(options)

      expect(result.workspaces).toEqual([])
    })

    it('should handle empty workspaces array', async () => {
      const options: GenerateStudioManifestOptions<ManifestWorkspaceInput> = {
        workspaces: [],
        resolveSchemaDescriptorId: () => 'schema-123',
        resolveIcon: () => undefined,
        bundleVersion: '3.0.0',
      }

      const result = await generateStudioManifest(options)

      expect(result.workspaces).toEqual([])
    })
  })

  describe('async schema descriptor resolution', () => {
    it('should support async resolveSchemaDescriptorId', async () => {
      const options: GenerateStudioManifestOptions<ManifestWorkspaceInput> = {
        workspaces: [createMockWorkspace()],
        resolveSchemaDescriptorId: async () => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10))
          return 'async-schema-123'
        },
        resolveIcon: () => undefined,
        bundleVersion: '3.0.0',
      }

      const result = await generateStudioManifest(options)

      expect(result.workspaces[0].schemaDescriptorId).toBe('async-schema-123')
    })

    it('should process multiple workspaces concurrently', async () => {
      const resolveOrder: string[] = []
      const options: GenerateStudioManifestOptions<ManifestWorkspaceInput> = {
        workspaces: [
          createMockWorkspace({name: 'workspace-1'}),
          createMockWorkspace({name: 'workspace-2'}),
          createMockWorkspace({name: 'workspace-3'}),
        ],
        resolveSchemaDescriptorId: async (ws) => {
          resolveOrder.push(`start-${ws.name}`)
          await new Promise((resolve) => setTimeout(resolve, 10))
          resolveOrder.push(`end-${ws.name}`)
          return `schema-${ws.name}`
        },
        resolveIcon: () => undefined,
        bundleVersion: '3.0.0',
      }

      await generateStudioManifest(options)

      // All starts should happen before any ends (concurrent execution)
      const startCount = resolveOrder.filter((r) => r.startsWith('start-')).length
      const firstEndIndex = resolveOrder.findIndex((r) => r.startsWith('end-'))
      expect(firstEndIndex).toBeGreaterThanOrEqual(startCount - 1)
    })
  })

  describe('workspace properties', () => {
    it('should handle optional basePath', async () => {
      const workspace = createMockWorkspace({basePath: ''})
      const options: GenerateStudioManifestOptions<ManifestWorkspaceInput> = {
        workspaces: [workspace],
        resolveSchemaDescriptorId: () => 'schema-123',
        resolveIcon: () => undefined,
        bundleVersion: '3.0.0',
      }

      const result = await generateStudioManifest(options)

      expect(result.workspaces[0].basePath).toBeUndefined()
    })

    it('should handle optional title', async () => {
      const workspace = createMockWorkspace({title: ''})
      const options: GenerateStudioManifestOptions<ManifestWorkspaceInput> = {
        workspaces: [workspace],
        resolveSchemaDescriptorId: () => 'schema-123',
        resolveIcon: () => undefined,
        bundleVersion: '3.0.0',
      }

      const result = await generateStudioManifest(options)

      expect(result.workspaces[0].title).toBeUndefined()
    })

    it('should handle optional subtitle', async () => {
      const workspace = createMockWorkspace({subtitle: 'My Subtitle'})
      const options: GenerateStudioManifestOptions<ManifestWorkspaceInput> = {
        workspaces: [workspace],
        resolveSchemaDescriptorId: () => 'schema-123',
        resolveIcon: () => undefined,
        bundleVersion: '3.0.0',
      }

      const result = await generateStudioManifest(options)

      expect(result.workspaces[0].subtitle).toBe('My Subtitle')
    })

    it('should include mediaLibraryId when mediaLibrary is enabled', async () => {
      const workspace = createMockWorkspace({
        mediaLibrary: {enabled: true, libraryId: 'lib-123'},
      })
      const options: GenerateStudioManifestOptions<ManifestWorkspaceInput> = {
        workspaces: [workspace],
        resolveSchemaDescriptorId: () => 'schema-123',
        resolveIcon: () => undefined,
        bundleVersion: '3.0.0',
      }

      const result = await generateStudioManifest(options)

      expect(result.workspaces[0].mediaLibraryId).toBe('lib-123')
    })

    it('should not include mediaLibraryId when mediaLibrary is disabled', async () => {
      const workspace = createMockWorkspace({
        mediaLibrary: {enabled: false, libraryId: 'lib-123'},
      })
      const options: GenerateStudioManifestOptions<ManifestWorkspaceInput> = {
        workspaces: [workspace],
        resolveSchemaDescriptorId: () => 'schema-123',
        resolveIcon: () => undefined,
        bundleVersion: '3.0.0',
      }

      const result = await generateStudioManifest(options)

      expect(result.workspaces[0].mediaLibraryId).toBeUndefined()
    })

    it('should not include mediaLibraryId when mediaLibrary is undefined', async () => {
      const workspace = createMockWorkspace({mediaLibrary: undefined})
      const options: GenerateStudioManifestOptions<ManifestWorkspaceInput> = {
        workspaces: [workspace],
        resolveSchemaDescriptorId: () => 'schema-123',
        resolveIcon: () => undefined,
        bundleVersion: '3.0.0',
      }

      const result = await generateStudioManifest(options)

      expect(result.workspaces[0].mediaLibraryId).toBeUndefined()
    })
  })

  describe('icon resolution', () => {
    it('should include resolved icon in manifest', async () => {
      const workspace = createMockWorkspace()
      const resolveIcon = vi.fn(() => '<svg>test-icon</svg>')
      const options: GenerateStudioManifestOptions<ManifestWorkspaceInput> = {
        workspaces: [workspace],
        resolveSchemaDescriptorId: () => 'schema-123',
        resolveIcon,
        bundleVersion: '3.0.0',
      }

      const result = await generateStudioManifest(options)

      expect(resolveIcon).toHaveBeenCalledWith(workspace)
      expect(result.workspaces[0].icon).toBe('<svg>test-icon</svg>')
    })

    it('should handle undefined icon', async () => {
      const options: GenerateStudioManifestOptions<ManifestWorkspaceInput> = {
        workspaces: [createMockWorkspace()],
        resolveSchemaDescriptorId: () => 'schema-123',
        resolveIcon: () => undefined,
        bundleVersion: '3.0.0',
      }

      const result = await generateStudioManifest(options)

      expect(result.workspaces[0].icon).toBeUndefined()
    })
  })

  describe('multiple workspaces', () => {
    it('should handle multiple workspaces with different configurations', async () => {
      const workspaces = [
        createMockWorkspace({
          name: 'workspace-1',
          projectId: 'project-1',
          dataset: 'production',
          title: 'Production',
        }),
        createMockWorkspace({
          name: 'workspace-2',
          projectId: 'project-2',
          dataset: 'staging',
          title: 'Staging',
        }),
      ]

      const options: GenerateStudioManifestOptions<ManifestWorkspaceInput> = {
        workspaces,
        resolveSchemaDescriptorId: (ws) => `schema-${ws.name}`,
        resolveIcon: (ws) => `<svg>${ws.name}-icon</svg>`,
        bundleVersion: '3.0.0',
      }

      const result = await generateStudioManifest(options)

      expect(result.workspaces).toHaveLength(2)
      expect(result.workspaces[0]).toMatchObject({
        name: 'workspace-1',
        projectId: 'project-1',
        dataset: 'production',
        schemaDescriptorId: 'schema-workspace-1',
        icon: '<svg>workspace-1-icon</svg>',
      })
      expect(result.workspaces[1]).toMatchObject({
        name: 'workspace-2',
        projectId: 'project-2',
        dataset: 'staging',
        schemaDescriptorId: 'schema-workspace-2',
        icon: '<svg>workspace-2-icon</svg>',
      })
    })
  })
})

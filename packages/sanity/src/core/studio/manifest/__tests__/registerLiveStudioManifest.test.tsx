import {buildTheme, type RootTheme} from '@sanity/ui/theme'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type Source, type WorkspaceSummary} from '../../../config/types'
import {type AuthStore} from '../../../store'
import {type UserApplication} from '../../../store/userApplications'
import {registerStudioManifest} from '../registerLiveStudioManifest'

// Mock the icon module to avoid styled-components complexity in tests
vi.mock('../icon', () => ({
  resolveIcon: vi.fn(() => '<svg>mock-icon</svg>'),
}))

const mockTheme: RootTheme = buildTheme()

describe('registerStudioManifest', () => {
  const mockRequest = vi.fn()
  const mockWithConfig = vi.fn()

  const mockConfiguredClient = {
    request: mockRequest,
    withConfig: mockWithConfig,
  }

  const mockUserApplication: UserApplication = {
    id: 'app-123',
    type: 'studio',
    projectId: 'app-project',
    urlType: 'internal',
    appHost: 'test-studio',
    apiHost: 'https://api.sanity.io',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockWithConfig.mockReturnValue(mockConfiguredClient)
    mockRequest.mockResolvedValue(undefined)
  })

  /**
   * Helper to create a mock WorkspaceSummary with the required structure.
   */
  function createMockWorkspace(
    overrides: Partial<{
      name: string
      projectId: string
      dataset: string
      title: string
      subtitle: string
      basePath: string
      schemaDescriptorId: string | undefined
      mediaLibrary: {enabled: boolean; libraryId?: string} | undefined
    }> = {},
  ): WorkspaceSummary {
    const name = overrides.name ?? 'default'
    // Default to 'app-project' to match mockUserApplication.projectId
    const projectId = overrides.projectId ?? 'app-project'
    const dataset = overrides.dataset ?? 'production'
    const title = overrides.title ?? 'Test Workspace'
    const subtitle = overrides.subtitle
    const basePath = overrides.basePath ?? '/'
    // Use 'schemaDescriptorId' in overrides to check if explicitly set (including undefined)
    const schemaDescriptorId =
      'schemaDescriptorId' in overrides ? overrides.schemaDescriptorId : 'schema-123'
    const mediaLibrary = overrides.mediaLibrary

    const mockSource = {
      __internal: {
        schemaDescriptorId: Promise.resolve(schemaDescriptorId),
      },
    } as unknown as Source

    const mockAuth: AuthStore = {
      state: of({
        authenticated: true,
        client: mockConfiguredClient,
        currentUser: null,
      }),
    } as unknown as AuthStore

    return {
      type: 'workspace-summary',
      name,
      projectId,
      dataset,
      title,
      subtitle,
      basePath,
      icon: null,
      customIcon: false,
      mediaLibrary,
      auth: mockAuth,
      __internal: {
        sources: [
          {
            name,
            projectId,
            dataset,
            title,
            source: of(mockSource),
          },
        ],
      },
    } as unknown as WorkspaceSummary
  }

  describe('client configuration', () => {
    it('should configure client with DEFAULT_STUDIO_CLIENT_OPTIONS', async () => {
      const workspace = createMockWorkspace()

      await registerStudioManifest(mockUserApplication, [workspace], mockTheme)

      expect(mockWithConfig).toHaveBeenCalledWith({
        apiVersion: '2025-02-19',
      })
    })
  })

  describe('successful registration', () => {
    it('should post manifest to the correct endpoint', async () => {
      const workspace = createMockWorkspace()

      await registerStudioManifest(mockUserApplication, [workspace], mockTheme)

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'POST',
        uri: '/projects/app-project/user-applications/app-123/config/live-manifest',
        body: {
          value: expect.objectContaining({
            workspaces: expect.any(Array),
          }),
        },
        tag: 'live-manifest-register',
      })
    })

    it('should include all workspace properties in manifest', async () => {
      const workspace = createMockWorkspace({
        name: 'my-workspace',
        projectId: 'app-project',
        dataset: 'staging',
        title: 'My Workspace',
        subtitle: 'Development',
        basePath: '/studio',
        schemaDescriptorId: 'schema-abc',
      })

      await registerStudioManifest(mockUserApplication, [workspace], mockTheme)

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            value: expect.objectContaining({
              bundleVersion: expect.any(String),
              workspaces: [
                {
                  name: 'my-workspace',
                  projectId: 'app-project',
                  dataset: 'staging',
                  schemaDescriptorId: 'schema-abc',
                  basePath: '/studio',
                  title: 'My Workspace',
                  subtitle: 'Development',
                  icon: '<svg>mock-icon</svg>',
                  mediaLibraryId: undefined,
                },
              ],
            }),
          },
        }),
      )
    })

    it('should handle multiple workspaces', async () => {
      // At least one workspace must match the userApplication projectId for auth
      const workspace1 = createMockWorkspace({
        name: 'workspace-1',
        projectId: 'app-project',
        schemaDescriptorId: 'schema-1',
      })
      const workspace2 = createMockWorkspace({
        name: 'workspace-2',
        projectId: 'proj-2',
        schemaDescriptorId: 'schema-2',
      })

      await registerStudioManifest(mockUserApplication, [workspace1, workspace2], mockTheme)

      const callArgs = mockRequest.mock.calls[0][0]
      expect(callArgs.body.value.workspaces).toHaveLength(2)
      expect(callArgs.body.value.workspaces[0].name).toBe('workspace-1')
      expect(callArgs.body.value.workspaces[1].name).toBe('workspace-2')
    })

    it('should include mediaLibraryId when mediaLibrary is enabled', async () => {
      const workspace = createMockWorkspace({
        mediaLibrary: {enabled: true, libraryId: 'lib-123'},
      })

      await registerStudioManifest(mockUserApplication, [workspace], mockTheme)

      const callArgs = mockRequest.mock.calls[0][0]
      expect(callArgs.body.value.workspaces[0].mediaLibraryId).toBe('lib-123')
    })

    it('should not include mediaLibraryId when mediaLibrary is disabled', async () => {
      const workspace = createMockWorkspace({
        mediaLibrary: {enabled: false, libraryId: 'lib-123'},
      })

      await registerStudioManifest(mockUserApplication, [workspace], mockTheme)

      const callArgs = mockRequest.mock.calls[0][0]
      expect(callArgs.body.value.workspaces[0].mediaLibraryId).toBeUndefined()
    })
  })

  describe('skipping registration', () => {
    it('should skip registration when no workspaces have schemaDescriptorId', async () => {
      const workspace = createMockWorkspace({
        schemaDescriptorId: undefined,
      })

      await registerStudioManifest(mockUserApplication, [workspace], mockTheme)

      expect(mockRequest).not.toHaveBeenCalled()
    })

    it('should skip registration when workspaces array is empty', async () => {
      await registerStudioManifest(mockUserApplication, [], mockTheme)

      expect(mockRequest).not.toHaveBeenCalled()
    })

    it('should filter out workspaces without schemaDescriptorId', async () => {
      const validWorkspace = createMockWorkspace({
        name: 'valid',
        schemaDescriptorId: 'schema-valid',
      })
      const invalidWorkspace = createMockWorkspace({
        name: 'invalid',
        schemaDescriptorId: undefined,
      })

      await registerStudioManifest(
        mockUserApplication,
        [validWorkspace, invalidWorkspace],
        mockTheme,
      )

      const callArgs = mockRequest.mock.calls[0][0]
      expect(callArgs.body.value.workspaces).toHaveLength(1)
      expect(callArgs.body.value.workspaces[0].name).toBe('valid')
    })
  })

  describe('workspace source resolution', () => {
    it('should handle workspace with no sources', async () => {
      const workspace = createMockWorkspace()
      // Override to have empty sources
      workspace.__internal.sources = []

      await registerStudioManifest(mockUserApplication, [workspace], mockTheme)

      // Should skip since no source means no schemaDescriptorId
      expect(mockRequest).not.toHaveBeenCalled()
    })
  })

  describe('optional fields', () => {
    it('should omit basePath when it is empty string', async () => {
      const workspace = createMockWorkspace({
        basePath: '',
      })

      await registerStudioManifest(mockUserApplication, [workspace], mockTheme)

      const callArgs = mockRequest.mock.calls[0][0]
      expect(callArgs.body.value.workspaces[0].basePath).toBeUndefined()
    })

    it('should omit title when not provided', async () => {
      const workspace = createMockWorkspace({
        title: '',
      })

      await registerStudioManifest(mockUserApplication, [workspace], mockTheme)

      const callArgs = mockRequest.mock.calls[0][0]
      expect(callArgs.body.value.workspaces[0].title).toBeUndefined()
    })

    it('should omit subtitle when not provided', async () => {
      const workspace = createMockWorkspace({
        subtitle: undefined,
      })

      await registerStudioManifest(mockUserApplication, [workspace], mockTheme)

      const callArgs = mockRequest.mock.calls[0][0]
      expect(callArgs.body.value.workspaces[0].subtitle).toBeUndefined()
    })
  })
})

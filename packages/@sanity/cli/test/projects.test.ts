import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createProject} from '../src/actions/project/createProject'
import {createProjectAction} from '../src/actions/project/createProjectAction'

function createMockSanityClient(
  config: {
    requests?: Record<string, any>
    requestCallback?: (request: {
      uri: string
      method: string
    }) => {statusCode: number; data: any} | undefined
  } = {},
) {
  const requests = config.requests || {}
  const requestLog: any[] = []

  const mockClient = {
    $log: {request: requestLog},
    config: () => ({projectId: 'test-project', dataset: 'test'}),
    withConfig: () => mockClient,
    request: async (opts: {uri: string; method?: string; body?: any}) => {
      requestLog.push(opts)

      // Check for custom callback first
      if (config.requestCallback) {
        const result = config.requestCallback({uri: opts.uri, method: opts.method || 'GET'})
        if (result) {
          if (result.statusCode >= 400) {
            throw new Error(result.data)
          }
          return result.data
        }
      }

      // Return pre-configured response
      if (requests[opts.uri]) {
        return requests[opts.uri]
      }

      return null
    },
  }

  return mockClient
}

// Mock the createProject function since we're testing the action business logic
// in ../src/actions/project/createProjectAction
vi.mock('../src/actions/project/createProject', () => ({
  createProject: vi.fn(),
}))

const mockCreateProject = vi.mocked(createProject)

describe('CLI: `sanity projects` (unit tests)', () => {
  describe('createProjectAction', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    test('creates project and makes correct API calls', async () => {
      const mockOrganizations = [{id: 'org-123', name: 'Test Org', slug: 'test-org'}]

      mockCreateProject.mockResolvedValue({
        projectId: 'test-project-123',
        displayName: 'Test Project',
      })

      const mockClient = createMockSanityClient({
        requests: {
          '/organizations': mockOrganizations,
          'organizations/org-123/grants': {
            'sanity.organization.projects': [{grants: [{name: 'attach'}]}],
          },
        },
      })

      const mockContext = {
        apiClient: vi.fn(() => mockClient),
        prompt: {single: vi.fn().mockResolvedValue('org-123')},
        output: {warn: vi.fn()},
      } as any

      const result = await createProjectAction(
        {
          projectName: 'Test Project',
          createDataset: false,
        },
        mockContext,
      )

      expect(result).toEqual({
        projectId: 'test-project-123',
        displayName: 'Test Project',
        organization: {id: 'org-123', name: 'Test Org'},
      })

      // Verify organization lookup was called
      expect(mockClient.$log.request).toContainEqual(
        expect.objectContaining({uri: '/organizations'}),
      )

      // Verify createProject was called with correct parameters
      expect(mockCreateProject).toHaveBeenCalledWith(mockContext.apiClient, {
        displayName: 'Test Project',
        organizationId: 'org-123',
        metadata: {integration: 'cli'},
      })
    })

    test('creates project with dataset and makes correct API calls', async () => {
      const mockOrganizations = [{id: 'org-456', name: 'Dataset Org', slug: 'dataset-org'}]

      mockCreateProject.mockResolvedValue({
        projectId: 'test-project-123',
        displayName: 'Test Project',
      })

      const mockClient = createMockSanityClient({
        requests: {
          '/organizations': mockOrganizations,
          'organizations/org-456/grants': {
            'sanity.organization.projects': [{grants: [{name: 'attach'}]}],
          },
          '/projects/test-project-123/datasets/production': undefined,
        },
      })

      const mockContext = {
        apiClient: vi.fn(() => mockClient),
        prompt: {single: vi.fn().mockResolvedValue('org-456')},
        output: {warn: vi.fn()},
      } as any

      const result = await createProjectAction(
        {
          projectName: 'Test Project',
          createDataset: true,
        },
        mockContext,
      )

      expect(result).toEqual({
        projectId: 'test-project-123',
        displayName: 'Test Project',
        organization: {id: 'org-456', name: 'Dataset Org'},
        dataset: {name: 'production'},
      })

      // Verify dataset creation API call
      expect(mockClient.$log.request).toContainEqual(
        expect.objectContaining({
          method: 'PUT',
          uri: '/projects/test-project-123/datasets/production',
        }),
      )
    })

    test('creates project with custom dataset settings', async () => {
      const mockOrganizations = [{id: 'org-789', name: 'Custom Org', slug: 'custom-org'}]

      mockCreateProject.mockResolvedValue({
        projectId: 'test-project-456',
        displayName: 'Custom Project',
      })

      const mockClient = createMockSanityClient({
        requests: {
          '/organizations': mockOrganizations,
          'organizations/org-789/grants': {
            'sanity.organization.projects': [{grants: [{name: 'attach'}]}],
          },
          '/projects/test-project-456/datasets/staging': undefined,
        },
      })

      const mockContext = {
        apiClient: vi.fn(() => mockClient),
        prompt: {single: vi.fn().mockResolvedValue('org-789')},
        output: {warn: vi.fn()},
      } as any

      const result = await createProjectAction(
        {
          projectName: 'Custom Project',
          createDataset: true,
          datasetName: 'staging',
          datasetVisibility: 'private',
        },
        mockContext,
      )

      expect(result).toEqual({
        projectId: 'test-project-456',
        displayName: 'Custom Project',
        organization: {id: 'org-789', name: 'Custom Org'},
        dataset: {name: 'staging'},
      })

      // Verify correct dataset creation call with private visibility
      expect(mockClient.$log.request).toContainEqual(
        expect.objectContaining({
          method: 'PUT',
          uri: '/projects/test-project-456/datasets/staging',
        }),
      )
    })

    test('resolves organization slug to ID', async () => {
      const organizations = [
        {id: 'org-abc123', name: 'Test Org', slug: 'test-org'},
        {id: 'org-def456', name: 'Other Org', slug: 'other-org'},
      ]

      mockCreateProject.mockResolvedValue({
        projectId: 'test-project-slug',
        displayName: 'Slug Project',
      })

      const mockClient = createMockSanityClient({
        requests: {
          '/organizations': organizations,
          'organizations/org-abc123/grants': {
            'sanity.organization.projects': [{grants: [{name: 'attach'}]}],
          },
        },
      })

      const mockContext = {
        apiClient: vi.fn(() => mockClient),
        prompt: {single: vi.fn()},
        output: {warn: vi.fn()},
      } as any

      const result = await createProjectAction(
        {
          projectName: 'Slug Project',
          organizationId: 'test-org', // Using slug instead of ID
        },
        mockContext,
      )

      expect(result).toEqual({
        projectId: 'test-project-slug',
        displayName: 'Slug Project',
        organization: {id: 'org-abc123', name: 'Test Org'},
      })

      // Verify createProject was called with the resolved organization ID, not the slug
      expect(mockCreateProject).toHaveBeenCalledWith(mockContext.apiClient, {
        displayName: 'Slug Project',
        organizationId: 'org-abc123', // Should be resolved to ID
        metadata: {integration: 'cli'},
      })

      // Should not prompt user since organization was specified
      expect(mockContext.prompt.single).not.toHaveBeenCalled()
    })

    test('handles unattended mode', async () => {
      const mockOrganizations = [
        {id: 'org-unattended', name: 'Unattended Org', slug: 'unattended-org'},
      ]

      mockCreateProject.mockResolvedValue({
        projectId: 'test-project-unattended',
        displayName: 'My Sanity Project',
      })

      const mockClient = createMockSanityClient({
        requests: {
          '/organizations': mockOrganizations,
          'organizations/org-unattended/grants': {
            'sanity.organization.projects': [{grants: [{name: 'attach'}]}],
          },
        },
      })

      const mockContext = {
        apiClient: vi.fn(() => mockClient),
        prompt: {single: vi.fn()},
        output: {warn: vi.fn()},
      } as any

      const result = await createProjectAction(
        {
          unattended: true,
        },
        mockContext,
      )

      expect(result).toEqual({
        projectId: 'test-project-unattended',
        displayName: 'My Sanity Project',
        organization: {id: 'org-unattended', name: 'Unattended Org'},
      })

      // Should not prompt user when in unattended mode
      expect(mockContext.prompt.single).not.toHaveBeenCalled()

      // Verify createProject was called with default project name and first organization
      expect(mockCreateProject).toHaveBeenCalledWith(mockContext.apiClient, {
        displayName: 'My Sanity Project',
        organizationId: 'org-unattended',
        metadata: {integration: 'cli'},
      })
    })

    test('handles dataset creation errors gracefully', async () => {
      const mockOrganizations = [{id: 'org-error', name: 'Error Org', slug: 'error-org'}]

      mockCreateProject.mockResolvedValue({
        projectId: 'test-project-error',
        displayName: 'Error Project',
      })

      const mockClient = createMockSanityClient({
        requests: {
          '/organizations': mockOrganizations,
          'organizations/org-error/grants': {
            'sanity.organization.projects': [{grants: [{name: 'attach'}]}],
          },
        },
        requestCallback: (request) => {
          if (request.uri.includes('/datasets/') && request.method === 'PUT') {
            return {statusCode: 400, data: 'Dataset creation failed'}
          }
          return undefined
        },
      })

      const mockContext = {
        apiClient: vi.fn(() => mockClient),
        prompt: {single: vi.fn().mockResolvedValue('org-error')},
        output: {warn: vi.fn()},
      } as any

      const result = await createProjectAction(
        {
          projectName: 'Error Project',
          createDataset: true,
        },
        mockContext,
      )

      // Project should still be created, but no dataset
      expect(result).toEqual({
        projectId: 'test-project-error',
        displayName: 'Error Project',
        organization: {id: 'org-error', name: 'Error Org'},
      })

      // Should log warning about dataset creation failure
      expect(mockContext.output.warn).toHaveBeenCalledWith(
        'Project created but dataset creation failed: Dataset creation failed',
      )
    })
  })
})

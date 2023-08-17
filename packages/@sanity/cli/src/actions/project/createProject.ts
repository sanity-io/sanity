import type {CliApiClient} from '../../types'

export interface CreateProjectOptions {
  displayName: string
  organizationId?: string
  subscription?: {planId: string}
  metadata?: {coupon?: string}
}

export function createProject(
  apiClient: CliApiClient,
  options: CreateProjectOptions,
): Promise<{projectId: string; displayName: string}> {
  return apiClient({
    requireUser: true,
    requireProject: false,
  })
    .request({
      method: 'POST',
      uri: '/projects',
      body: options,
    })
    .then((response) => ({
      projectId: response.projectId || response.id,
      displayName: options.displayName || '',
    }))
}

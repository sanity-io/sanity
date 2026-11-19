import {ClientError, type SanityClient} from '@sanity/client'
import QuickLRU from 'quick-lru'
import {describe, expect, it, vi} from 'vitest'

import {
  createRequestFailureProbe,
  type RequestFailureDiagnostics,
} from '../../../../studio/requestErrors/diagnoseRequestFailure'
import {type CorsCheckCache} from '../../../../studio/workspaces/corsCheck'
import {getCurrentUser} from '../getCurrentUser'

function projectDisabledError(): ClientError {
  return new ClientError({
    statusCode: 402,
    headers: {},
    body: {
      statusCode: 402,
      error: 'Project Disabled',
      message: 'This project has been disabled by a project administrator',
    },
    url: 'https://abc123.api.sanity.io/v1/users/me',
    method: 'GET',
  } as never)
}

function clientRejectingWith(error: Error): SanityClient {
  return {
    config: () => ({
      projectId: 'abc123',
      apiHost: 'https://api.sanity.io',
      url: 'https://abc123.api.sanity.io/v1',
    }),
    request: async () => {
      throw error
    },
  } as unknown as SanityClient
}

function createDiagnostics(): RequestFailureDiagnostics {
  const corsCache: CorsCheckCache = new QuickLRU({maxAge: 1000 * 60 * 2, maxSize: 200})
  return {
    diagnose: (error, client) => createRequestFailureProbe(client, corsCache)(error),
    onRequestFailure: vi.fn<RequestFailureDiagnostics['onRequestFailure']>(),
  }
}

describe('getCurrentUser', () => {
  it('reports a disabled project and resolves as logged out when /users/me returns a Project Disabled 402', async () => {
    const client = clientRejectingWith(projectDisabledError())
    const diagnostics = createDiagnostics()

    const currentUser = await getCurrentUser(client, 'initial', undefined, diagnostics)

    expect(currentUser).toBeUndefined()
    expect(diagnostics.onRequestFailure).toHaveBeenCalledWith({type: 'project-disabled'}, client)
  })
})

import {type ClientConfig, createClient, type SanityClient} from '@sanity/client'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {prepareConfig} from '../../config/prepareConfig'
import {type WorkspaceOptions} from '../../config/types'
import {preloadSignedInStudio} from '../preloadSignedInStudio'

// Token storage falls back to memory when the environment looks like Node.js.
vi.mock('../../util/supportsLocalStorage', () => ({
  supportsLocalStorage: true,
}))

const requestedUrls: string[] = []

// Records the requests instead of sending them, including those of clients derived with `withConfig`.
function parkingClientFactory(config: ClientConfig): SanityClient {
  const client = createClient(config)
  vi.spyOn(client, 'withConfig').mockReturnValue(client)
  vi.spyOn(client, 'request').mockImplementation(({url}) => {
    requestedUrls.push(url ?? '')
    return new Promise(() => {})
  })
  return client
}

function createWorkspace(name: string): WorkspaceOptions {
  return {
    name,
    basePath: `/${name}`,
    projectId: `test-${Math.random().toString(36).slice(2)}`,
    dataset: 'test',
    unstable_clientFactory: parkingClientFactory,
  }
}

function storeToken(workspace: WorkspaceOptions) {
  localStorage.setItem(
    `__studio_auth_token_${workspace.projectId}`,
    JSON.stringify({token: 'mock-token'}),
  )
}

describe('preloadSignedInStudio', () => {
  beforeEach(() => {
    localStorage.clear()
    requestedUrls.length = 0
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('starts the current user probe for the workspace the path points at when it has a token', async () => {
    const second = createWorkspace('second')
    storeToken(second)
    const {workspaces} = prepareConfig([createWorkspace('first'), second])

    const probe = preloadSignedInStudio(workspaces, '/second/structure')

    expect(probe).toBeDefined()
    await vi.waitFor(() => {
      expect(requestedUrls).toContain('/users/me')
    })
    probe?.unsubscribe()
  })

  it('starts nothing when the workspace the path points at has no session', () => {
    const second = createWorkspace('second')
    storeToken(second)
    const {workspaces} = prepareConfig([createWorkspace('first'), second])

    expect(preloadSignedInStudio(workspaces, '/first')).toBeUndefined()
    expect(requestedUrls).toEqual([])
  })

  it('falls back to the first workspace when the path matches none', () => {
    const first = createWorkspace('first')
    storeToken(first)
    const {workspaces} = prepareConfig([first, createWorkspace('second')])

    const probe = preloadSignedInStudio(workspaces, '/')

    expect(probe).toBeDefined()
    probe?.unsubscribe()
  })
})

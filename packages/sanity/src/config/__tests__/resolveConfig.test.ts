import createClient from '@sanity/client'
import {of} from 'rxjs'
import {bufferTime, first} from 'rxjs/operators'
import {createMockAuthStore} from '../../datastores/authStore/createMockAuthStore'
import {resolveConfig, createWorkspaceFromConfig, createSourceFromConfig} from '../resolveConfig'

describe('resolveConfig', () => {
  it('returns an observable that emits an array of fully resolved workspaces', async () => {
    const projectId = 'ppsg7ml5'
    const dataset = 'production'
    const client = createClient({
      projectId,
      apiVersion: '2021-06-07',
      dataset,
      useCdn: false,
    })

    const [workspace] = await resolveConfig({
      name: 'default',
      dataset,
      projectId,
      auth: createMockAuthStore({client, currentUser: null}),
    })
      .pipe(first())
      .toPromise()

    expect(workspace).toMatchObject({
      type: 'workspace',
      name: 'default',
      projectId: 'ppsg7ml5',
      dataset: 'production',
      unstable_sources: [
        {
          dataset: 'production',
          name: 'default',
          projectId: 'ppsg7ml5',
        },
      ],
    })
  })

  it('emits a new value if the auth stores emit a new auth state', async () => {
    const projectId = 'ppsg7ml5'
    const dataset = 'production'
    const client = createClient({
      projectId,
      apiVersion: '2021-06-07',
      dataset,
      useCdn: false,
    })

    const results = await resolveConfig({
      name: 'default',
      dataset,
      projectId,
      auth: {
        state: of(
          {authenticated: true, client, currentUser: null},
          {
            authenticated: true,
            client,
            currentUser: {
              id: 'test',
              name: 'test',
              email: 'hello@example.com',
              role: '',
              roles: [],
            },
          }
        ),
      },
    })
      // this will buffer the results emitted in the observable into an array
      .pipe(bufferTime(50))
      .toPromise()

    expect(results).toHaveLength(2)
    const [firstResult, secondResult] = results

    expect(firstResult).toMatchObject([
      {
        name: 'default',
        projectId: 'ppsg7ml5',
        dataset: 'production',
        currentUser: null,
        unstable_sources: [
          {
            dataset: 'production',
            name: 'default',
            projectId: 'ppsg7ml5',
          },
        ],
      },
    ])

    expect(secondResult).toMatchObject([
      {
        type: 'workspace',
        name: 'default',
        projectId: 'ppsg7ml5',
        dataset: 'production',
        // note the extra user here
        currentUser: {
          id: 'test',
          name: 'test',
          email: 'hello@example.com',
        },
        unstable_sources: [
          {
            dataset: 'production',
            name: 'default',
            projectId: 'ppsg7ml5',
          },
        ],
      },
    ])
  })
})

describe('createWorkspaceFromConfig', () => {
  it('creates a promise that resolves to a full workspace', async () => {
    const projectId = 'ppsg7ml5'
    const dataset = 'production'

    const workspace = await createWorkspaceFromConfig({
      projectId,
      dataset,
      name: 'default',
    })

    expect(workspace).toMatchObject({
      type: 'workspace',
      name: 'default',
      projectId: 'ppsg7ml5',
      dataset: 'production',
      currentUser: null,
      unstable_sources: [
        {
          dataset: 'production',
          name: 'default',
          projectId: 'ppsg7ml5',
        },
      ],
    })
  })

  it('allows overriding the `currentUser` and `client`', async () => {
    const projectId = 'ppsg7ml5'
    const dataset = 'production'
    const client = createClient({
      projectId,
      apiVersion: '2021-06-07',
      dataset,
      useCdn: false,
    })
    const currentUser = {
      id: 'test',
      name: 'test',
      email: 'hello@example.com',
      role: '',
      roles: [],
    }

    const workspace = await createWorkspaceFromConfig({
      projectId,
      dataset,
      name: 'default',
      client,
      currentUser,
    })

    expect(workspace).toMatchObject({
      type: 'workspace',
      name: 'default',
      projectId: 'ppsg7ml5',
      dataset: 'production',
      currentUser: {
        id: 'test',
        name: 'test',
        email: 'hello@example.com',
      },
      unstable_sources: [
        {
          dataset: 'production',
          name: 'default',
          projectId: 'ppsg7ml5',
        },
      ],
    })
  })
})

describe('createSourceFromConfig', () => {
  it('calls `createWorkspaceFromConfig` and returns the first source', async () => {
    const projectId = 'ppsg7ml5'
    const dataset = 'production'

    const source = await createSourceFromConfig({
      projectId,
      dataset,
      name: 'default',
    })

    expect(source).toMatchObject({
      type: 'source',
      name: 'default',
      projectId: 'ppsg7ml5',
      dataset: 'production',
      currentUser: null,
    })
  })
})

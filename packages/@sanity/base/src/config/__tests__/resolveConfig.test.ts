import {Observable, Subject} from 'rxjs'
import {CurrentUser} from '@sanity/types'
import {take} from 'rxjs/operators'
import {resolveConfig} from '../resolveConfig'
import {createConfig} from '../createConfig'
import {createUserStore} from '../../datastores/user'

// @ts-expect-error this is the mocked value
const userSubject = createUserStore().me as Subject<CurrentUser>

jest.mock('../../auth', () => ({
  createAuthController: () => ({mockAuthController: true}),
}))

jest.mock('../../datastores/authState', () => ({
  createAuthStore: () => ({mockAuthStore: true}),
}))

jest.mock('../../datastores/user', () => {
  const Rx = require('rxjs')
  const me = new Rx.ReplaySubject(1)

  return {
    createUserStore: () => ({me}),
  }
})

describe('resolveConfig', () => {
  it('partially resolves workspace configurations with multi-source support', () => {
    const config = createConfig([
      {
        name: 'default',
        projectId: 'myProject',
        dataset: 'first',
      },
      {
        name: 'second',
        projectId: 'myProject',
        dataset: 'second',
        unstable_sources: [
          {
            projectId: 'anotherProject',
            dataset: 'products',
            name: 'additionalSource',
          },
        ],
      },
    ])

    // `resolveConfig` returns partially resolved workspaces and sources synchronously
    const result = resolveConfig(config)
    const {workspaces} = result.__internal
    expect(workspaces).toHaveLength(2)
    const [firstWorkspace, secondWorkspace] = workspaces

    // first workspace
    expect(firstWorkspace.sources).toHaveLength(1)
    const [firstWorkspaceRootSource] = firstWorkspace.sources
    expect(firstWorkspaceRootSource).toMatchObject({
      dataset: 'first',
      name: 'root',
      projectId: 'myProject',
      schema: {},
      // notice the subscribe method, this is how to resolve the rest of the
      // config which requires auth and resolves the user asynchronously
      subscribe: {},
    })

    // second workspace
    expect(secondWorkspace.sources).toHaveLength(2)
    const [secondWorkspaceRootSource, secondWorkspaceAdditionalSource] = secondWorkspace.sources

    expect(secondWorkspaceRootSource).toMatchObject({
      dataset: 'second',
      name: 'root',
      projectId: 'myProject',
      schema: {},
      subscribe: {},
    })
    expect(secondWorkspaceAdditionalSource).toMatchObject({
      dataset: 'products',
      name: 'additionalSource',
      projectId: 'anotherProject',
      schema: {},
      subscribe: {},
    })
  })

  it('returns subscribe-able sources that resolve the full source', async () => {
    const config = createConfig({
      name: 'default',
      projectId: 'myProject',
      dataset: 'production',
    })

    const [partiallyResolvedWorkspace] = resolveConfig(config).__internal.workspaces
    const [rootSource] = partiallyResolvedWorkspace.sources

    setTimeout(() => {
      userSubject.next({
        email: 'user@example.com',
        id: 'exampleUserId',
        name: 'name',
        roles: [{name: 'admin', title: 'Admin'}],
        role: 'admin',
      })
    })

    const source = await new Observable((observer) => rootSource.subscribe(observer))
      .pipe(take(1))
      .toPromise()

    expect(source).toMatchObject({
      schema: {},
      unstable_auth: {},
      client: {},
      dataset: 'production',
      projectId: 'myProject',
      tools: [],
      previewUrl: {},
    })
  })

  it.todo('throws a MissingAuthError if there is no user')
  it.todo('throws errors with breadcrumbs')
  it.todo('collects multiple workspaces and sources errors at once')
})

describe('configuration properties', () => {
  it.todo('schema.types')
  it.todo('previewUrl')
  it.todo('tools')
})

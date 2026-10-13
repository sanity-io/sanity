import {act, render, screen} from '@testing-library/react'
import {createMemoryHistory} from 'history'
import {useEffect, useState} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../test/mocks/mockSanityClient'
import {createMockAuthStore} from '../../store/authStore/createMockAuthStore'
import {type ResourceCache, useResourceCache} from '../../store/ResourceCacheProvider'
import {StudioLayout} from '../StudioLayout'
import {StudioProvider} from '../StudioProvider'
import {useWorkspace} from '../workspace'

vi.mock('../components/navbar/new-document/NewDocumentButton')
vi.mock('../components/navbar/new-document/useNewDocumentOptions')
vi.mock('../components/navbar/presence/PresenceMenu')

/**
 * Switching workspace in place (`history.push` to another workspace's
 * basePath, which is what the workspace menu does) must tear the previous
 * workspace's tree down and mount the next one fresh, rather than re-render
 * the same component instances under a new workspace context.
 *
 * That is what keeps a switch from leaking state between datasets: every
 * store lives in the `ResourceCache` under `WorkspaceLoader`, and only a
 * remount replaces it. The switch was turned into a full document load in
 * sanity-io/sanity#7228 because the stores of two workspaces could stay
 * alive at once and execute each other's mutations.
 */

const mounts: {workspace: string; cache: ResourceCache; instance: object}[] = []
const unmounts: string[] = []

function WorkspaceProbe() {
  const {name, dataset} = useWorkspace()
  const cache = useResourceCache()
  // Identity of this mounted instance: a re-render in place keeps it, a
  // remount gets a new one.
  const [instance] = useState(() => ({}))

  useEffect(() => {
    mounts.push({workspace: name, cache, instance})
    return () => {
      unmounts.push(name)
    }
  }, [cache, instance, name])

  return <div data-testid="workspace-probe">{`${name}:${dataset}`}</div>
}

describe('StudioProvider workspace switching', () => {
  afterEach(() => {
    mounts.length = 0
    unmounts.length = 0
  })

  it(
    'remounts the workspace tree with a fresh resource cache on an in-place switch',
    {timeout: 30_000},
    async () => {
      const client = createMockSanityClientAsClient()
      const auth = createMockAuthStore({
        client,
        currentUser: {
          id: 'doug',
          name: 'Doug',
          email: 'doug@sanity.io',
          // oxlint-disable-next-line no-deprecated -- `role` is still part of CurrentUser
          role: 'admin',
          roles: [{name: 'administrator', title: 'Administrator'}],
        },
      })
      const workspace = (name: string, dataset: string) => ({
        name,
        title: name,
        basePath: `/${name}`,
        projectId: 'test',
        dataset,
        schema: {types: []},
        auth,
        studio: {components: {layout: WorkspaceProbe}},
      })
      const history = createMemoryHistory({initialEntries: ['/a']})

      // oxlint-disable-next-line testing-library/no-unnecessary-act -- the workspace resolves asynchronously during mount
      await act(async () => {
        render(
          <StudioProvider
            config={[workspace('a', 'dataset-a'), workspace('b', 'dataset-b')]}
            unstable_history={history}
          >
            <StudioLayout />
          </StudioProvider>,
        )
      })

      expect(await screen.findByTestId('workspace-probe')).toHaveTextContent('a:dataset-a')
      expect(mounts.map((mount) => mount.workspace)).toEqual(['a'])

      await act(async () => {
        history.push('/b')
      })

      expect(await screen.findByTestId('workspace-probe')).toHaveTextContent('b:dataset-b')
      // The previous workspace's tree is gone, not re-rendered in place…
      expect(unmounts).toEqual(['a'])
      expect(mounts.map((mount) => mount.workspace)).toEqual(['a', 'b'])
      expect(mounts[1].instance).not.toBe(mounts[0].instance)
      // …and the new tree builds its stores in a cache of its own.
      expect(mounts[1].cache).not.toBe(mounts[0].cache)

      await act(async () => {
        history.push('/a')
      })

      expect(await screen.findByTestId('workspace-probe')).toHaveTextContent('a:dataset-a')
      expect(unmounts).toEqual(['a', 'b'])
      expect(mounts.map((mount) => mount.workspace)).toEqual(['a', 'b', 'a'])
      // Coming back does not resurrect the first visit's tree or stores either.
      expect(mounts[2].instance).not.toBe(mounts[0].instance)
      expect(mounts[2].cache).not.toBe(mounts[0].cache)
    },
  )
})

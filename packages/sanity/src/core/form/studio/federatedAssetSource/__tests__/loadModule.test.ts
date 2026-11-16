import {describe, expect, it, vi} from 'vitest'

import {loadFederatedAssetSourceModule} from '../loadModule'

const {loadRemote} = vi.hoisted(() => ({loadRemote: vi.fn()}))

vi.mock('@sanity/sdk-react/dashboard', () => ({
  createRemoteInstance: () => ({registerRemotes: vi.fn(), loadRemote}),
}))

function load({version, entry}: {version: number; entry: string}) {
  const module = {render: vi.fn(), version}
  loadRemote.mockResolvedValue(module)
  const ref = {
    remote: {name: 'app', entry},
    moduleId: 'app/views/picker/asset_source',
  }

  return {module, loaded: loadFederatedAssetSourceModule(ref)}
}

describe('loadFederatedAssetSourceModule', () => {
  it.each([
    {version: 1, entry: 'https://v1.example/mf-manifest.json'},
    {version: 2, entry: 'https://v2.example/mf-manifest.json'},
  ])('loads an asset source view that exports view contract version $version', async (remote) => {
    const {module, loaded} = load(remote)

    await expect(loaded).resolves.toBe(module)
  })

  it('rejects an asset source view that exports view contract version 3', async () => {
    const {loaded} = load({version: 3, entry: 'https://v3.example/mf-manifest.json'})

    await expect(loaded).rejects.toThrow(
      'app/views/picker/asset_source implements view contract version 3, but this Studio supports versions 1, 2',
    )
  })
})

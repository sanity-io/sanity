import noop from 'lodash-es/noop.js'
import {describe, expect, it, vi} from 'vitest'

import {loadFederatedAssetSourceModule} from '../loadModule'
import {type FederatedAssetSourceViewProps} from '../types'

const {loadRemote} = vi.hoisted(() => ({loadRemote: vi.fn()}))

vi.mock('@sanity/sdk-react/dashboard', () => ({
  createRemoteInstance: () => ({registerRemotes: vi.fn(), loadRemote}),
}))

const VIEW_PROPS: FederatedAssetSourceViewProps = {
  view: {
    id: 'app-picker',
    type: 'asset_source',
    name: 'picker',
    title: 'Picker',
    version: '1',
    moduleId: 'views/picker',
    metadata: null,
  },
  action: 'select',
  assetSource: {name: 'app:picker', component: () => null},
  assetType: 'image',
  accept: 'image/*',
  selectionType: 'single',
  selectedAssets: [],
  onClose: noop,
  onSelect: noop,
}

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
  it('loads an asset source view that exports view contract version 2', async () => {
    const {module, loaded} = load({version: 2, entry: 'https://v2.example/mf-manifest.json'})

    await expect(loaded).resolves.toBe(module)
  })

  it('renders an asset source view that exports view contract version 1 without `view`', async () => {
    const {module, loaded} = load({version: 1, entry: 'https://v1.example/mf-manifest.json'})
    const rootElement = document.createElement('div')
    const {view: _view, ...v1Props} = VIEW_PROPS

    ;(await loaded).render(rootElement, VIEW_PROPS)

    expect(module.render.mock.calls[0]?.[0]).toBe(rootElement)
    expect(module.render.mock.calls[0]?.[1]).toStrictEqual(v1Props)
  })

  it('rejects an asset source view that exports view contract version 3', async () => {
    const {loaded} = load({version: 3, entry: 'https://v3.example/mf-manifest.json'})

    await expect(loaded).rejects.toThrow(
      'app/views/picker/asset_source implements view contract version 3, but this Studio supports version 2',
    )
  })
})

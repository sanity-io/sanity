import {type AssetSource, type AssetSourceComponentProps} from '@sanity/types'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render} from '@testing-library/react'
import noop from 'lodash-es/noop.js'
import {beforeEach, expect, test, vi} from 'vitest'

import {stubMessageBusHost} from '../../../../../../test/testUtils/stubMessageBusHost'
import {FederatedViewMount} from '../FederatedViewMount'
import {loadFederatedAssetSourceModule} from '../loadModule'
import {type FederatedAssetSourceView} from '../types'

vi.mock('../loadModule', () => ({
  loadFederatedAssetSourceModule: vi.fn(),
}))

const theme = buildTheme()

const VIEW: FederatedAssetSourceView = {
  applicationId: 'stock-app',
  applicationName: 'stock-photos',
  applicationTitle: 'Stock Photos',
  name: 'stock',
  title: 'Stock photos',
  remote: {name: 'stock-app', entry: 'https://stock.example/mf-manifest.json'},
  moduleId: 'stock-app/views/stock/asset_source',
}

const ASSET_SOURCE: AssetSource = {
  name: 'stock-app:stock',
  // oxlint-disable-next-line no-deprecated -- mirrors createFederatedAssetSource: a runtime title from the deployment record, no i18n key exists
  title: 'Stock photos',
  component: () => null,
}

const VIEW_PROPS: AssetSourceComponentProps = {
  action: 'select',
  assetSource: ASSET_SOURCE,
  assetType: 'image',
  accept: 'image/*',
  selectionType: 'single',
  selectedAssets: [],
  onClose: noop,
  onSelect: noop,
}

beforeEach(() => {
  vi.mocked(loadFederatedAssetSourceModule).mockReset()
})

test('renders the view with its module id and the studio connection as its parent, on every render', async () => {
  const host = stubMessageBusHost()
  const renderView = vi.fn(() => ({dispose: noop}))
  vi.mocked(loadFederatedAssetSourceModule).mockResolvedValue({version: 1, render: renderView})
  const mount = (viewProps: AssetSourceComponentProps) => (
    <ThemeProvider theme={theme}>
      <FederatedViewMount onUnavailable={noop} view={VIEW} viewProps={viewProps} />
    </ThemeProvider>
  )

  const {rerender} = render(mount(VIEW_PROPS))
  await vi.waitFor(() => expect(renderView).toHaveBeenCalled())
  const calls = renderView.mock.calls.length
  rerender(mount({...VIEW_PROPS, accept: 'image/png'}))
  await vi.waitFor(() => expect(renderView.mock.calls.length).toBeGreaterThan(calls))

  const studio = host.connections().find((client) => client.appId === 'studio')
  expect(studio?.key).toEqual(expect.any(String))
  expect(renderView.mock.calls.map((call) => call.at(2))).toEqual(
    renderView.mock.calls.map(() => ({moduleId: VIEW.moduleId, parentKey: studio?.key})),
  )
})

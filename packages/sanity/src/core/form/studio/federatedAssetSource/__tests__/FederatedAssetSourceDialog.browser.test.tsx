import {type AssetSource, type AssetSourceComponentProps} from '@sanity/types'
import noop from 'lodash-es/noop.js'
import {beforeEach, describe, expect, test, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {FederatedAssetSourceDialog} from '../FederatedAssetSourceDialog'
import {loadFederatedAssetSourceModule} from '../loadModule'
import {type FederatedAssetSourceView} from '../types'

vi.mock('../loadModule', () => ({
  loadFederatedAssetSourceModule: vi.fn(),
}))

const VIEW: FederatedAssetSourceView = {
  applicationId: 'stock-app',
  applicationName: 'stock-photos',
  applicationTitle: 'Stock Photos',
  name: 'stock',
  title: 'Stock photos',
  local: false,
  remote: {name: 'stock-app', entry: 'https://stock.example/mf-manifest.json'},
  moduleId: 'stock-app/views/stock/asset_source',
}

const ASSET_SOURCE: AssetSource = {
  name: 'stock-app:stock',
  // oxlint-disable-next-line no-deprecated -- mirrors createFederatedAssetSource: a runtime title from the deployment record, no i18n key exists
  title: 'Stock photos',
  component: () => null,
}

const SOURCE_PROPS: AssetSourceComponentProps = {
  action: 'select',
  assetSource: ASSET_SOURCE,
  assetType: 'image',
  accept: 'image/*',
  selectionType: 'single',
  selectedAssets: [],
  onClose: noop,
  onSelect: noop,
}

function DialogHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <FederatedAssetSourceDialog sourceProps={SOURCE_PROPS} view={VIEW} />
    </TestWrapper>
  )
}

beforeEach(() => {
  vi.mocked(loadFederatedAssetSourceModule).mockReset()
})

/**
 * Visual coverage for the full-surface dialog hosting a brokered view: the
 * dialog chrome (header from the view title, body border, surface fill) with
 * a mounted view, and the inline unavailable state a broken remote degrades
 * to when no `onUnavailable` recovery is provided. The view module is mocked
 * at the `loadModule` seam — the real federation runtime needs a live remote.
 */
describe('FederatedAssetSourceDialog', () => {
  test('mounts the brokered view inside the full-surface dialog', async () => {
    const {settleChromaticEndState} = testHelpers()
    vi.mocked(loadFederatedAssetSourceModule).mockResolvedValue({
      version: 1,
      render: (rootElement) => {
        rootElement.textContent = 'Brokered view content'
        return {dispose: noop}
      },
    })

    void render(<DialogHarness />)

    await expect.element(page.getByTestId('federated-asset-source-dialog')).toBeVisible()
    await expect.element(page.getByText('Stock photos')).toBeVisible()
    await expect.element(page.getByText('Brokered view content')).toBeVisible()
    await settleChromaticEndState()
  })

  test('shows the inline unavailable copy when the remote fails to load', async () => {
    const {settleChromaticEndState} = testHelpers()
    // FederatedViewMount warns on every failure by design; keep the test
    // output clean without asserting on the logging.
    vi.spyOn(console, 'warn').mockImplementation(noop)
    vi.mocked(loadFederatedAssetSourceModule).mockRejectedValue(
      new Error('remote entry unreachable'),
    )

    void render(<DialogHarness />)

    await expect.element(page.getByTestId('federated-asset-source-dialog')).toBeVisible()
    await expect
      .element(page.getByText('This asset source failed to load. Close the dialog and try again.'))
      .toBeVisible()
    await settleChromaticEndState()
  })
})

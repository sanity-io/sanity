import {type SanityClient} from '@sanity/client'
import {type Asset, type AssetSource} from '@sanity/types'
import noop from 'lodash-es/noop.js'
import {type ComponentType, type PropsWithChildren} from 'react'
import {of} from 'rxjs'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {createMockSanityClient} from '../../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {AssetDeleteDialog} from '../AssetDeleteDialog'
import {SelectAssetsDialog} from '../SelectAssetsDialog'

const FILE_ASSET: Asset = {
  _id: 'file-fixture-quarterly-report',
  _type: 'sanity.fileAsset',
  _rev: 'fixture-revision',
  _createdAt: '',
  _updatedAt: '',
  assetId: 'quarterly-report',
  extension: 'pdf',
  mimeType: 'application/pdf',
  originalFilename: 'quarterly-report-final-approved-version.pdf',
  path: 'files/quarterly-report.pdf',
  sha1hash: 'fixture-sha',
  size: 1_258_291,
  url: 'https://cdn.sanity.io/files/test/test/quarterly-report.pdf',
}

const assetSource: AssetSource = {
  name: 'fixture-source',
  component: () => null,
}

function createDialogClient() {
  const client = createMockSanityClient()
  client.observable.fetch = (query: string) =>
    of(query.includes('_type == "sanity.fileAsset"') ? [FILE_ASSET] : [])
  return client as unknown as SanityClient
}

function AssetDeleteDialogHarness({Provider}: {Provider: ComponentType<PropsWithChildren>}) {
  return (
    <Provider>
      <AssetDeleteDialog asset={FILE_ASSET} assetType="file" onClose={noop} onDelete={noop} />
    </Provider>
  )
}

function SelectAssetsDialogHarness({Provider}: {Provider: ComponentType<PropsWithChildren>}) {
  return (
    <Provider>
      <SelectAssetsDialog
        accept="application/pdf"
        action="select"
        assetSource={assetSource}
        assetType="file"
        onClose={noop}
        onSelect={noop}
        selectedAssets={[FILE_ASSET]}
        selectionType="single"
      />
    </Provider>
  )
}

describe('dataset asset dialogs', () => {
  test('renders a loaded file deletion confirmation', async () => {
    const {settleChromaticEndState} = testHelpers()
    const Provider = await createTestProvider({client: createDialogClient()})
    void render(<AssetDeleteDialogHarness Provider={Provider} />)

    await expect
      .element(page.getByText('quarterly-report-final-approved-version.pdf'))
      .toBeVisible()
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    await settleChromaticEndState()
  })

  test('renders a loaded file selection dialog', async () => {
    const {settleChromaticEndState} = testHelpers()
    const Provider = await createTestProvider({client: createDialogClient()})
    void render(<SelectAssetsDialogHarness Provider={Provider} />)

    await expect.element(page.getByText('PDF Document')).toBeVisible()
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    await settleChromaticEndState()
  })
})

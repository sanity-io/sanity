import {type SanityClient} from '@sanity/client'
import {type Asset} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type ComponentType, type PropsWithChildren} from 'react'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {createMockSanityClient} from '../../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {AssetRow} from '../AssetRow'
import {FileListView} from '../FileListView'

const FILE_ASSETS: Asset[] = [
  {
    _id: 'file-fixture-quarterly-report',
    _type: 'sanity.fileAsset',
    _rev: 'fixture-revision-1',
    _createdAt: '',
    _updatedAt: '',
    assetId: 'quarterly-report',
    extension: 'pdf',
    mimeType: 'application/pdf',
    originalFilename: 'quarterly-report-final-approved-version.pdf',
    path: 'files/quarterly-report.pdf',
    sha1hash: 'fixture-sha-one',
    size: 1_258_291,
    url: 'https://cdn.sanity.io/files/test/test/quarterly-report.pdf',
  },
  {
    _id: 'file-fixture-notes',
    _type: 'sanity.fileAsset',
    _rev: 'fixture-revision-2',
    _createdAt: '',
    _updatedAt: '',
    assetId: 'release-notes',
    extension: 'txt',
    mimeType: 'text/plain',
    originalFilename: 'release-notes.txt',
    path: 'files/release-notes.txt',
    sha1hash: 'fixture-sha-two',
    size: 4096,
    url: 'https://cdn.sanity.io/files/test/test/release-notes.txt',
  },
]

function FileListViewHarness({Provider}: {Provider: ComponentType<PropsWithChildren>}) {
  return (
    <Provider>
      <Card padding={4} style={{maxWidth: 900}}>
        <Stack gap={5}>
          <FileListView
            assets={FILE_ASSETS}
            onDeleteFinished={noop}
            selectedAssets={[FILE_ASSETS[0]]}
          />
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              expanded mobile row
            </Text>
            <div data-testid="mobile-asset-row">
              <AssetRow asset={FILE_ASSETS[0]} isMobile onDeleteFinished={noop} />
            </div>
          </Stack>
        </Stack>
      </Card>
    </Provider>
  )
}

describe('dataset file list', () => {
  test('renders desktop rows and expands the mobile row', async () => {
    const {settleChromaticEndState} = testHelpers()
    const client = createMockSanityClient() as unknown as SanityClient
    const Provider = await createTestProvider({client})
    void render(<FileListViewHarness Provider={Provider} />)

    await expect.element(page.getByText('PDF Document')).toBeVisible()
    const mobileRow = document.querySelector('[data-testid="mobile-asset-row"]')
    if (!(mobileRow instanceof HTMLElement)) throw new Error('Expected the mobile asset row')
    const expandButton = mobileRow.querySelector('button:not([data-id])')
    if (!(expandButton instanceof HTMLButtonElement)) {
      throw new Error('Expected the mobile asset-row expand button')
    }
    await userEvent.click(expandButton)
    await expect.element(page.getByTestId('mobile-asset-row').getByText('Show usage')).toBeVisible()
    await settleChromaticEndState()
  })
})

import {type SanityClient} from '@sanity/client'
import {render} from '@testing-library/react'
import noop from 'lodash-es/noop.js'
import {type ReactNode, useRef} from 'react'
import {describe, expect, test, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {MediaLibraryIdsContext} from '../../../../../_singletons/context/MediaLibraryIdsContext'
import {decodeJsonParams, encodeJsonParams} from '../../../../../router/utils/jsonParamsEncoding'

// SelectAssetsDialog calls useFormValue for validation; stub so we need not wrap FormValueProvider
// (embedding FormValueProvider alongside other imports in this file breaks RouterProvider resolution).
vi.mock('../../../contexts/FormValue', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../../contexts/FormValue')>()
  return {
    ...mod,
    useFormValue: () => undefined,
  }
})

async function renderWithStudioTree(
  client: SanityClient,
  config: {projectId: string; dataset: string; name: string},
  children: ReactNode,
) {
  const TestProvider = await createTestProvider({
    client,
    config: {
      projectId: config.projectId,
      dataset: config.dataset,
      name: config.name,
    },
  })
  return render(
    <TestProvider>
      <MediaLibraryIdsContext.Provider
        value={{organizationId: 'test-org-id', libraryId: 'test-library-id'}}
      >
        {children}
      </MediaLibraryIdsContext.Provider>
    </TestProvider>,
  )
}

describe('Media Library plugin iframe payloads', () => {
  test('SelectAssetsDialog iframe src contains pickerPersistenceKey in createPluginView', async () => {
    const {SelectAssetsDialog} = await import('../shared/SelectAssetsDialog')
    const client = createMockSanityClient() as any as SanityClient
    function Harness() {
      const ref = useRef<HTMLDivElement>(null)
      return <SelectAssetsDialog open onClose={noop} onSelect={noop} ref={ref} selection={[]} />
    }
    await renderWithStudioTree(client, {projectId: 'p1', dataset: 'd1', name: 'ws1'}, <Harness />)

    const iframe = document.querySelector<HTMLIFrameElement>('iframe[src*="createPluginView"]')
    expect(iframe).toBeTruthy()
    const src = iframe!.getAttribute('src')!
    const url = new URL(src)
    const raw = url.searchParams.get('createPluginView')
    expect(raw).toBeTruthy()
    const parsed = decodeJsonParams(raw!) as {pickerPersistenceKey?: string}
    const expectedKey =
      encodeJsonParams({
        projectId: 'p1',
        dataset: 'd1',
        workspaceName: 'ws1',
      }) || undefined
    expect(parsed.pickerPersistenceKey).toBe(expectedKey)
  })

  test('OpenInSourceDialog iframe payload omits pickerPersistenceKey', async () => {
    const {OpenInSourceDialog} = await import('../shared/OpenInSourceDialog')
    const client = createMockSanityClient() as any as SanityClient
    await renderWithStudioTree(
      client,
      {projectId: 'p1', dataset: 'd1', name: 'ws1'},
      <OpenInSourceDialog
        asset={
          {
            _id: 'asset-1',
            _type: 'sanity.imageAsset',
            source: {name: 'mux', id: 'mux-asset-99'},
          } as any
        }
        dialogHeaderTitle="Open"
        selectNewAssetButtonLabel="Select"
        onClose={noop}
        onSelectNewAsset={noop}
      />,
    )

    const iframe = document.querySelector<HTMLIFrameElement>('iframe[src*="createPluginView"]')
    expect(iframe).toBeTruthy()
    const src = iframe!.getAttribute('src')!
    const url = new URL(src)
    expect(url.pathname).toContain('/assets/mux-asset-99')
    const raw = url.searchParams.get('createPluginView')
    expect(raw).toBeTruthy()
    const parsed = decodeJsonParams(raw!) as {
      pickerPersistenceKey?: string
      disableNavigation?: boolean
    }
    expect(parsed.pickerPersistenceKey).toBeUndefined()
    expect(parsed.disableNavigation).toBe(true)
  })
})

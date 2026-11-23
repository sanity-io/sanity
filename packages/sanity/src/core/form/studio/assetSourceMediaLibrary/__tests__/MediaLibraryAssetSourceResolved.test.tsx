import {type SanityClient} from '@sanity/client'
import type * as TelemetryReactMod from '@sanity/telemetry/react'
import {type AssetSource, type AssetSourceComponentProps} from '@sanity/types'
import {render, waitFor} from '@testing-library/react'
import noop from 'lodash-es/noop.js'
import {type ReactNode} from 'react'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {ColorSchemeProvider} from '../../../../studio/colorScheme'
import type * as FormValueMod from '../../../contexts/FormValue'
import {loadFederatedAssetSourceModule} from '../../federatedAssetSource/loadModule'
import {type FederatedAssetSourceView} from '../../federatedAssetSource/types'
import {MediaLibraryAssetSourceResolved} from '../__telemetry__/mediaLibraryAssetSource.telemetry'
import {
  createFederatedSanityMediaLibraryImageSource,
  createIframeSanityMediaLibraryImageSource,
} from '../createAssetSource'
import {MediaLibraryUploader} from '../uploader'

const log = vi.hoisted(() => vi.fn())

vi.mock('@sanity/telemetry/react', async (importOriginal) => ({
  ...(await importOriginal<typeof TelemetryReactMod>()),
  useTelemetry: () => ({log}),
}))

vi.mock('../../federatedAssetSource/loadModule', () => ({
  loadFederatedAssetSourceModule: vi.fn(),
}))

// The candidate-validation hook reads useFormValue; stub it so the harness
// need not mount FormValueProvider.
vi.mock('../../../contexts/FormValue', async (importOriginal) => ({
  ...(await importOriginal<typeof FormValueMod>()),
  useFormValue: () => undefined,
}))

// MediaLibraryProvider's ensure-flow talks to the real API; provide the ids
// context directly.
vi.mock('../shared/MediaLibraryProvider', async () => {
  const {MediaLibraryIdsContext} = await import('sanity/_singletons')
  return {
    MediaLibraryProvider: ({children}: {children: ReactNode}) => (
      <MediaLibraryIdsContext.Provider
        value={{organizationId: 'test-org-id', libraryId: 'test-library-id'}}
      >
        {children}
      </MediaLibraryIdsContext.Provider>
    ),
  }
})

const VIEW: FederatedAssetSourceView = {
  applicationId: 'ml-app',
  applicationName: 'media-library',
  applicationTitle: 'Media Library',
  name: 'picker',
  title: 'Media Library',
  remote: {name: 'ml-app', entry: 'https://ml.example/mf-manifest.json'},
  moduleId: 'ml-app/views/picker/asset_source',
  interface: {
    id: 'ml-app-picker',
    type: 'asset_source',
    name: 'picker',
    title: 'Media Library',
    version: '1',
    moduleId: 'views/picker',
    metadata: null,
  },
}

function sourceProps(
  assetSource: AssetSource,
  overrides: Partial<AssetSourceComponentProps> = {},
): AssetSourceComponentProps {
  return {
    action: 'select',
    assetSource,
    assetType: 'image',
    accept: 'image/*',
    selectionType: 'single',
    selectedAssets: [],
    onClose: noop,
    onSelect: noop,
    ...overrides,
  }
}

async function renderSource(assetSource: AssetSource, props: AssetSourceComponentProps) {
  const client = createMockSanityClient() as any as SanityClient
  const TestProvider = await createTestProvider({
    client,
    config: {projectId: 'p1', dataset: 'd1', name: 'ws1'},
  })
  const Component = assetSource.component
  return render(
    <TestProvider>
      <ColorSchemeProvider>
        <Component {...props} />
      </ColorSchemeProvider>
    </TestProvider>,
  )
}

function resolvedEvents() {
  return log.mock.calls.filter(([event]) => event === MediaLibraryAssetSourceResolved)
}

beforeEach(() => {
  log.mockReset()
  vi.mocked(loadFederatedAssetSourceModule).mockReset()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('Media Library Asset Source Resolved', () => {
  test('reports the federated outcome once the view has mounted', async () => {
    vi.mocked(loadFederatedAssetSourceModule).mockResolvedValue({
      version: 1,
      render: () => ({dispose: noop}),
    })
    const source = createFederatedSanityMediaLibraryImageSource({libraryId: null, view: VIEW})

    await renderSource(source, sourceProps(source))

    await waitFor(() => expect(resolvedEvents()).toHaveLength(1))
    expect(resolvedEvents()[0][1]).toEqual({
      outcome: 'federated',
      reason: null,
      action: 'select',
      durationMs: expect.any(Number),
    })
  })

  test('reports a load failure once, without a second event from the iframe fallback', async () => {
    vi.mocked(loadFederatedAssetSourceModule).mockRejectedValue(new Error('remote failed to load'))
    const source = createFederatedSanityMediaLibraryImageSource({libraryId: null, view: VIEW})
    const uploader = new MediaLibraryUploader()
    uploader.upload([new File(['a'], 'a.png', {type: 'image/png'})])

    await renderSource(source, sourceProps(source, {action: 'upload', uploader}))

    // The iframe fallback's hidden upload dialog mounts an iframe.
    await waitFor(() => expect(document.querySelector('iframe')).toBeTruthy())
    expect(resolvedEvents()).toHaveLength(1)
    expect(resolvedEvents()[0][1]).toEqual({
      outcome: 'iframe_fallback',
      reason: 'load_failed',
      action: 'upload',
      durationMs: expect.any(Number),
    })
  })

  test('reports the resolution the iframe source was created with when it opens', async () => {
    const source = createIframeSanityMediaLibraryImageSource({
      libraryId: null,
      resolution: {outcome: 'iframe_fallback', reason: 'cold_start'},
    })

    const {unmount} = await renderSource(source, sourceProps(source, {action: 'openInSource'}))

    await waitFor(() => expect(resolvedEvents()).toHaveLength(1))
    expect(resolvedEvents()[0][1]).toEqual({
      outcome: 'iframe_fallback',
      reason: 'cold_start',
      action: 'openInSource',
      durationMs: null,
    })

    // Every open reports again.
    unmount()
    await renderSource(source, sourceProps(source))
    await waitFor(() => expect(resolvedEvents()).toHaveLength(2))
    expect(resolvedEvents()[1][1]).toMatchObject({action: 'select', reason: 'cold_start'})
  })
})

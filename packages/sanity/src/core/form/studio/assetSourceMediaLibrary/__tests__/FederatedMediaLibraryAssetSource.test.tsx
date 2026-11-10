import {type SanityClient} from '@sanity/client'
import {type AssetSource, type AssetSourceComponentProps} from '@sanity/types'
import {render, waitFor} from '@testing-library/react'
import noop from 'lodash-es/noop.js'
import {type ReactNode} from 'react'
import {describe, expect, test, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {ColorSchemeProvider} from '../../../../studio/colorScheme'
import type * as FormValueMod from '../../../contexts/FormValue'
import {loadFederatedAssetSourceModule} from '../../federatedAssetSource/loadModule'
import {type FederatedAssetSourceView} from '../../federatedAssetSource/types'
import {FederatedMediaLibraryAssetSource} from '../federated/FederatedMediaLibraryAssetSource'
import {MediaLibraryUploader} from '../uploader'

vi.mock('../../federatedAssetSource/loadModule', () => ({
  loadFederatedAssetSourceModule: vi.fn(),
}))

// The candidate-validation hook reads useFormValue; stub it so the harness
// need not mount FormValueProvider (same treatment as the plugin dialogs
// test in this directory).
vi.mock('../../../contexts/FormValue', async (importOriginal) => {
  const mod = await importOriginal<typeof FormValueMod>()
  return {
    ...mod,
    useFormValue: () => undefined,
  }
})

// Both the federated component and the iframe fallback wrap themselves in
// MediaLibraryProvider, whose ensure-flow talks to the real API; stub it to
// provide the ids context directly.
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
}

const ASSET_SOURCE: AssetSource = {
  name: 'sanity-media-library',
  // oxlint-disable-next-line no-deprecated -- test fixture mirrors the runtime source shape
  title: 'Media Library',
  component: () => null,
}

describe('FederatedMediaLibraryAssetSource upload fallback', () => {
  // BUGBOT 839f380e: the iframe fallback dialog only sends `uploadRequest`
  // when every file is still `pending`. A view failing after it marked files
  // `uploading` (or failed some with `error`) must rewind them on the swap,
  // or the batch is neither resumed nor failed and the field sticks in its
  // upload state.
  test('rewinds mid-flight upload files to pending when falling back to the iframe source', async () => {
    vi.mocked(loadFederatedAssetSourceModule).mockRejectedValue(new Error('remote failed to load'))

    const uploader = new MediaLibraryUploader()
    const [first, second, third] = uploader.upload([
      new File(['a'], 'a.png', {type: 'image/png'}),
      new File(['b'], 'b.png', {type: 'image/png'}),
      new File(['c'], 'c.png', {type: 'image/png'}),
    ])
    // The view got partway through the batch before dying.
    uploader.updateFile(first.id, {status: 'uploading', progress: 40})
    uploader.updateFile(second.id, {status: 'error', error: new Error('view-side failure')})

    const sourceProps: AssetSourceComponentProps = {
      action: 'upload',
      assetSource: ASSET_SOURCE,
      assetType: 'image',
      accept: 'image/*',
      selectionType: 'single',
      selectedAssets: [],
      onClose: noop,
      onSelect: noop,
      uploader,
    }

    const client = createMockSanityClient() as any as SanityClient
    const TestProvider = await createTestProvider({
      client,
      config: {projectId: 'p1', dataset: 'd1', name: 'ws1'},
    })

    render(
      <TestProvider>
        <ColorSchemeProvider>
          <FederatedMediaLibraryAssetSource
            {...sourceProps}
            libraryId="test-library-id"
            view={VIEW}
          />
        </ColorSchemeProvider>
      </TestProvider>,
    )

    // The load failure reports onUnavailable, which swaps in the iframe
    // source (hidden upload dialog mounts an iframe).
    await waitFor(() => expect(document.querySelector('iframe')).toBeTruthy())

    // Every file the dead view left behind is pending again, so the iframe
    // dialog's all-pending gate issues a fresh uploadRequest for the batch.
    expect(uploader.getFiles().map((file) => file.status)).toEqual([
      'pending',
      'pending',
      'pending',
    ])
    expect(uploader.getFiles().map((file) => file.progress)).toEqual([0, 0, 0])
    expect(third.status).toBe('pending')
  })

  // BUGBOT d8636908: a `complete`/`alreadyExists` file is already linked into
  // the document. Today's view can't leave one behind mid-batch (terminal
  // statuses flush in one synchronous burst that ends in `all-complete`), but
  // the picker-mode contract would permit a per-file-flushing view — and
  // resuming such a batch through the iframe would link the finished files a
  // second time. The swap must fail the unfinished files instead, so
  // `all-complete` releases the field.
  test('fails the unfinished files instead of rewinding when part of the batch is already linked', async () => {
    vi.mocked(loadFederatedAssetSourceModule).mockRejectedValue(new Error('remote failed to load'))

    const uploader = new MediaLibraryUploader()
    const [first, second, third] = uploader.upload([
      new File(['a'], 'a.png', {type: 'image/png'}),
      new File(['b'], 'b.png', {type: 'image/png'}),
      new File(['c'], 'c.png', {type: 'image/png'}),
    ])
    // A (hypothetical, contract-legal) per-file-flushing view linked the
    // first file before dying mid-batch.
    uploader.updateFile(first.id, {status: 'complete', progress: 100})
    uploader.updateFile(second.id, {status: 'uploading', progress: 40})

    const events: string[] = []
    uploader.subscribe((event) => events.push(event.type))

    const sourceProps: AssetSourceComponentProps = {
      action: 'upload',
      assetSource: ASSET_SOURCE,
      assetType: 'image',
      accept: 'image/*',
      selectionType: 'single',
      selectedAssets: [],
      onClose: noop,
      onSelect: noop,
      uploader,
    }

    const client = createMockSanityClient() as any as SanityClient
    const TestProvider = await createTestProvider({
      client,
      config: {projectId: 'p1', dataset: 'd1', name: 'ws1'},
    })

    render(
      <TestProvider>
        <ColorSchemeProvider>
          <FederatedMediaLibraryAssetSource
            {...sourceProps}
            libraryId="test-library-id"
            view={VIEW}
          />
        </ColorSchemeProvider>
      </TestProvider>,
    )

    await waitFor(() => expect(document.querySelector('iframe')).toBeTruthy())

    // The unfinished files were failed (not rewound), so every file went
    // terminal: the error + all-complete pair fired and the uploader reset
    // its list — the field is released rather than stuck mid-batch.
    expect(second.status).toBe('error')
    expect(third.status).toBe('error')
    expect(first.status).toBe('complete')
    expect(events).toContain('error')
    expect(events).toContain('all-complete')
    expect(uploader.getFiles()).toEqual([])
  })
})

import {type SanityClient} from '@sanity/client'
import {Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type ComponentType, type PropsWithChildren} from 'react'
import {throwError} from 'rxjs'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {createMockSanityClient} from '../../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {EnsureMediaLibrary} from '../EnsureMediaLibrary'
import {MediaLibraryProvider} from '../MediaLibraryProvider'

function EnsureMediaLibraryHarness({Provider}: {Provider: ComponentType<PropsWithChildren>}) {
  return (
    <Provider>
      <EnsureMediaLibrary
        mediaLibraryInfo={{from: 'project', projectId: 'test'}}
        onSetMediaLibraryIds={noop}
      />
    </Provider>
  )
}

function MediaLibraryProviderHarness({Provider}: {Provider: ComponentType<PropsWithChildren>}) {
  return (
    <Provider>
      <MediaLibraryProvider projectId="test">
        <Text>Media library content</Text>
      </MediaLibraryProvider>
    </Provider>
  )
}

describe('media library provisioning', () => {
  test('renders the expected provisioning error', async () => {
    const {settleChromaticEndState} = testHelpers()
    const client = createMockSanityClient({
      requests: {'/projects/test': {}},
    }) as unknown as SanityClient
    const Provider = await createTestProvider({
      client,
      config: {projectId: 'test', dataset: 'test', name: 'test'},
    })
    void render(<EnsureMediaLibraryHarness Provider={Provider} />)

    await expect.element(page.getByTestId('ERROR_NO_ORGANIZATION_FOUND')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders the unexpected provider error', async () => {
    const {settleChromaticEndState} = testHelpers()
    const mockClient = createMockSanityClient()
    mockClient.observable.request = () =>
      throwError(() => new Error('Fixture media service unavailable'))
    const Provider = await createTestProvider({
      client: mockClient as unknown as SanityClient,
      config: {projectId: 'test', dataset: 'test', name: 'test'},
    })
    void render(<MediaLibraryProviderHarness Provider={Provider} />)

    await expect.element(page.getByTestId('MEDIA_LIBRARY_ERROR_UNEXPECTED')).toBeVisible()
    await settleChromaticEndState()
  })
})

import {createSanityInstance} from '@sanity/sdk'
import {getOrCreateNode} from '@sanity/sdk/comlink'
import {render, screen, waitFor} from '@testing-library/react'
import {afterEach, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {FavoriteToggle} from '../FavoriteToggle'

// The Dashboard's `_context` param, read when the rendering context module loads.
vi.hoisted(() => {
  window.history.replaceState(
    null,
    '',
    `?_context=${encodeURIComponent(JSON.stringify({mode: 'core-ui', env: 'test'}))}`,
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

it('reads the favorite from the Dashboard over Comlink', async () => {
  // Comlink needs Studio to be rendered in a frame.
  vi.spyOn(window, 'top', 'get').mockReturnValue(null)
  const node = getOrCreateNode(createSanityInstance(), {
    name: 'dashboard/nodes/sdk',
    connectTo: 'dashboard/channels/sdk',
  })
  const fetch = vi.spyOn(node, 'fetch').mockResolvedValue({isFavorited: true})
  const TestProvider = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

  render(
    <TestProvider>
      <FavoriteToggle documentId="book-1" documentType="book" documentExists />
    </TestProvider>,
  )

  await waitFor(() => expect(screen.getByRole('button')).toBeEnabled())
  expect(screen.getByRole('button')).toHaveAccessibleName('Remove from favorites')
  expect(fetch).toHaveBeenCalledWith('dashboard/v1/events/favorite/query', {
    document: {
      id: 'book-1',
      type: 'book',
      resource: {id: 'mock-project-id.mock-data-set', type: 'studio', schemaName: 'default'},
    },
  })
})

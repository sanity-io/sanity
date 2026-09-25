import {ResourceProvider} from '@sanity/sdk-react'
import {type MessageBusMessage, type PayloadOf, type ReplyOf} from '@sanity/sdk/dashboard'
import {act, render, screen, waitFor} from '@testing-library/react'
import {type ComponentType, type ReactNode} from 'react'
import {beforeAll, expect, it, onTestFinished, vi} from 'vitest'

import {stubMessageBusHost} from '../../../../../../../test/testUtils/stubMessageBusHost'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {FavoriteToggle} from '../FavoriteToggle'

type FavoritesUpdate = MessageBusMessage<
  PayloadOf<'favorites.update'>,
  ReplyOf<'favorites.update'>,
  'favorites.update'
>

// The resource is the mock workspace's project, dataset and name.
const FAVORITE: FavoritesUpdate['payload']['document'] = {
  id: 'book-1',
  type: 'book',
  resource: {id: 'mock-project-id.mock-data-set', type: 'dataset', schemaName: 'default'},
}

let TestProvider: ComponentType<{children?: ReactNode}>

beforeAll(async () => {
  TestProvider = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
})

function stubFavoritesHost(favorites: FavoritesUpdate['payload']['document'][]) {
  const host = stubMessageBusHost()
  host.publish('applications.capabilities', {favorites: true})
  host.publish('favorites.documents', favorites)
  const updates: FavoritesUpdate[] = []
  host.respond('favorites.update', (message) => {
    updates.push(message)
  })
  return {host, updates}
}

function renderToggle({documentExists = true} = {}) {
  render(
    <TestProvider>
      <ResourceProvider projectId="test" dataset="test" fallback={null}>
        <FavoriteToggle documentId="book-1" documentType="book" documentExists={documentExists} />
      </ResourceProvider>
    </TestProvider>,
  )
}

// A disabled toggle stands in until the host's favorites arrive.
function findEnabledToggle() {
  return waitFor(() => {
    const button = screen.getByRole('button')
    expect(button).toBeEnabled()
    return button
  })
}

it('shows the favorite status the host publishes', async () => {
  stubFavoritesHost([FAVORITE])

  renderToggle()
  expect(await findEnabledToggle()).toHaveAccessibleName('Remove from favorites')
})

it.each([
  {action: 'favorites', favorites: [], favorited: true, name: 'Remove from favorites'},
  {action: 'unfavorites', favorites: [FAVORITE], favorited: false, name: 'Add to favorites'},
])(
  '$action optimistically while the host writes the change',
  async ({favorites, favorited, name}) => {
    const {host, updates} = stubFavoritesHost(favorites)
    renderToggle()
    const button = await findEnabledToggle()

    act(() => button.click())

    expect(button).toHaveAccessibleName(name)
    expect(updates.map(({payload}) => payload)).toEqual([{document: FAVORITE, favorited}])

    act(() => host.publish('favorites.documents', favorited ? [FAVORITE] : []))
    await act(async () => updates[0].reply())

    expect(button).toHaveAccessibleName(name)
  },
)

it('ignores clicks while a write is in flight', async () => {
  const {updates} = stubFavoritesHost([])
  renderToggle()
  const button = await findEnabledToggle()

  act(() => button.click())
  act(() => button.click())

  expect(button).toHaveAccessibleName('Remove from favorites')
  expect(updates).toHaveLength(1)
  await act(async () => updates[0].reply())
})

it('is disabled while the document does not exist', async () => {
  stubFavoritesHost([FAVORITE])

  renderToggle({documentExists: false})

  expect(await screen.findByRole('button', {name: 'Remove from favorites'})).toBeDisabled()
})

it('logs a failed write and falls back to the host value', async () => {
  const {host} = stubFavoritesHost([])
  host.respond('favorites.update', () => {
    throw new Error('write failed')
  })
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  onTestFinished(() => error.mockRestore())
  renderToggle()
  const button = await findEnabledToggle()

  await act(async () => button.click())

  expect(button).toHaveAccessibleName('Add to favorites')
  expect(error).toHaveBeenCalledWith('Favorites service write error', expect.anything())
})

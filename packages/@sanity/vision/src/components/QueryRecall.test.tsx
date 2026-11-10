import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type QueryConfig} from '../hooks/useSavedQueries'
import {QueryRecall} from './QueryRecall'
import {type ParsedUrlState} from './VisionGui'

// @sanity/ui's ThemeProvider reads the color scheme preference
vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)

const theme = buildTheme()

const mocks = vi.hoisted(() => ({
  saveQuery: vi.fn(),
  deleteQuery: vi.fn(),
  shareQuery: vi.fn(),
  unshareQuery: vi.fn(),
}))

vi.mock('sanity', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  useTranslation: () => ({t: (key: string) => key}),
  useDateTimeFormat: () => ({format: () => 'a date'}),
  ContextMenuButton: (props: Record<string, unknown>) => (
    <button type="button" data-testid="query-menu" {...props} />
  ),
  UserAvatar: () => null,
}))

const personal: QueryConfig = {
  _key: 'personal-1',
  title: 'Personal',
  url: 'https://abc.api.sanity.io/v2025-02-19/data/query/production?query=*',
  savedAt: '2026-01-01T00:00:00Z',
}
const shared: QueryConfig = {
  _key: 'shared-1',
  title: 'Shared',
  url: 'https://abc.api.sanity.io/v2025-02-19/data/query/production?query=*%5B_type%3D%3D%22a%22%5D',
  savedAt: '2026-01-01T00:00:00Z',
  shared: true,
  authorId: 'user-1',
  isOwnedByCurrentUser: true,
}

vi.mock('../hooks/useSavedQueries', () => ({
  useSavedQueries: () => ({
    queries: [personal, shared],
    saveQuery: mocks.saveQuery,
    updateQuery: vi.fn(),
    deleteQuery: mocks.deleteQuery,
    shareQuery: mocks.shareQuery,
    unshareQuery: mocks.unshareQuery,
    clearQueries: vi.fn(),
    saving: false,
    deleting: [],
    moving: [],
    saveQueryError: undefined,
    deleteQueryError: undefined,
    error: undefined,
  }),
}))

/** Enough of a parsed URL for the duplicate check: the query text is what differs */
function getStateFromUrl(url: string): ParsedUrlState {
  return {
    query: new URL(url).searchParams.get('query') || '',
    params: {},
    rawParams: '{}',
    dataset: 'production',
    apiVersion: 'v2025-02-19',
    customApiVersion: false,
    perspective: undefined,
    url,
  }
}

function renderRecall() {
  return render(
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <LayerProvider>
          <QueryRecall
            currentParams={{}}
            currentQuery="*"
            generateUrl={() => personal.url}
            getStateFromUrl={getStateFromUrl}
            setStateFromParsedUrl={vi.fn()}
          />
        </LayerProvider>
      </ToastProvider>
    </ThemeProvider>,
  )
}

/** Opens the query's menu and picks the item with the given text */
function pickMenuItem(menuIndex: number, text: string) {
  fireEvent.click(screen.getAllByTestId('query-menu')[menuIndex])
  fireEvent.click(screen.getByText(text))
}

describe('QueryRecall', () => {
  beforeEach(() => {
    mocks.shareQuery.mockResolvedValue(undefined)
    mocks.unshareQuery.mockResolvedValue(undefined)
  })

  afterEach(cleanup)

  it('shares a query through the one move the hook offers', async () => {
    renderRecall()
    pickMenuItem(0, 'label.share')
    fireEvent.click(await screen.findByText('action.save-shared-query'))

    await waitFor(() => expect(mocks.shareQuery).toHaveBeenCalledWith('personal-1'))
    // The toast is committed together with the dialog's close, which its transition holds up
    await screen.findByText('save-query.shared-success', {}, {timeout: 3_000})
    expect(mocks.shareQuery).toHaveBeenCalledWith('personal-1')
    // Not composed from a save and a delete, whose failed removal reported success
    expect(mocks.saveQuery).not.toHaveBeenCalled()
    expect(mocks.deleteQuery).not.toHaveBeenCalled()
  })

  it('reports a share whose move failed as an error, not a success', async () => {
    mocks.shareQuery.mockRejectedValue(new Error('personal copy stayed'))
    renderRecall()
    pickMenuItem(0, 'label.share')
    fireEvent.click(await screen.findByText('action.save-shared-query'))

    await screen.findByText('save-query.error', {}, {timeout: 3_000})
    expect(screen.getByText('personal copy stayed')).toBeTruthy()
    expect(screen.queryByText('save-query.shared-success')).toBeNull()
  })

  it('unshares through the hook and reports a failed move as an error', async () => {
    mocks.unshareQuery.mockRejectedValue(new Error('shared copy stayed'))
    renderRecall()
    pickMenuItem(1, 'action.unshare')

    await screen.findByText('save-query.error')
    expect(mocks.unshareQuery).toHaveBeenCalledWith('shared-1')
    expect(mocks.saveQuery).not.toHaveBeenCalled()
    expect(mocks.deleteQuery).not.toHaveBeenCalled()
    expect(screen.queryByText('save-query.unshared-success')).toBeNull()
    // The shared query, hidden while its move was in flight, is listed again
    await waitFor(() => expect(screen.getAllByTestId('query-menu')).toHaveLength(2))
  })
})

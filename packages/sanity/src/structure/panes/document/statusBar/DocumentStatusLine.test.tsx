import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {act, type ComponentType, type ReactNode} from 'react'
import {EMPTY, of} from 'rxjs'
import {
  ColorSchemeProvider,
  type EditDocumentVersionEvent,
  type EventsStore,
  UserColorManagerProvider,
} from 'sanity'
import {EventsContext} from 'sanity/_singletons'
import {beforeAll, beforeEach, describe, expect, it, type MockedFunction, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {
  type DocumentPaneContextValue,
  type DocumentPaneInfoContextValue,
} from '../DocumentPaneContext'
import {useDocumentPane} from '../useDocumentPane'
import {useDocumentPaneInfo} from '../useDocumentPaneInfo'
import {DocumentStatusLine} from './DocumentStatusLine'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useSyncState: vi.fn(() => ({isSyncing: false})),
}))

vi.mock('../useDocumentPane', () => ({useDocumentPane: vi.fn()}))
vi.mock('../useDocumentPaneInfo', () => ({useDocumentPaneInfo: vi.fn()}))

const mockUseDocumentPane = useDocumentPane as MockedFunction<
  () => Partial<DocumentPaneContextValue>
>
const mockUseDocumentPaneInfo = useDocumentPaneInfo as MockedFunction<
  () => Partial<DocumentPaneInfoContextValue>
>

const EDIT_EVENT: EditDocumentVersionEvent = {
  id: 'edit-1',
  type: 'editDocumentVersion',
  documentId: 'doc-123',
  documentVariantType: 'draft',
  author: 'pAda',
  contributors: ['pAda'],
  revisionId: 'rev-1',
  timestamp: '2026-10-09T12:00:00Z',
  transactions: [],
}

const eventsStore: EventsStore = {
  events: [EDIT_EVENT],
  nextCursor: null,
  loading: false,
  error: null,
  revision: null,
  sinceRevision: null,
  findRangeForRevision: () => [null, null],
  findRangeForSince: () => [null, null],
  loadMoreEvents: () => undefined,
  getChangesList: () => EMPTY,
  expandEvent: async () => undefined,
  lastNonDeletedRevId: null,
  getDocumentAtRevision: () => of(null),
}

let TestProvider: ComponentType<{children: ReactNode}>

beforeAll(async () => {
  TestProvider = await createTestProvider({
    client: createMockSanityClientAsClient({
      requests: {'/users/pAda': {id: 'pAda', displayName: 'Ada Lovelace'}},
    }),
  })
})

/**
 * The last editor's avatar suspends until the user loads, and React only resumes work that
 * suspended inside an awaited `act`.
 */
async function renderStatusLine() {
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- see doc comment
  await act(async () => {
    render(
      <ColorSchemeProvider scheme="light">
        <UserColorManagerProvider>
          <EventsContext value={eventsStore}>
            <DocumentStatusLine />
          </EventsContext>
        </UserColorManagerProvider>
      </ColorSchemeProvider>,
      {wrapper: TestProvider},
    )
  })
}

describe('DocumentStatusLine', () => {
  const onHistoryOpen = vi.fn()

  beforeEach(() => {
    mockUseDocumentPane.mockReturnValue({
      inspector: null,
      onHistoryClose: vi.fn(),
      onHistoryOpen,
      targetDocumentState: {status: 'resolving'},
      value: {_id: 'drafts.doc-123', _type: 'author'},
    })
    mockUseDocumentPaneInfo.mockReturnValue({documentId: 'doc-123', documentType: 'author'})
  })

  it("shows the last editor's name when hovering their avatar", async () => {
    await renderStatusLine()

    await userEvent.hover(await screen.findByLabelText('Ada Lovelace'))

    await waitFor(() => expect(screen.getByText('Ada Lovelace')).toBeVisible())
  })

  it('opens the history inspector when the avatar is clicked', async () => {
    await renderStatusLine()

    await userEvent.click(await screen.findByLabelText('Ada Lovelace'))

    expect(onHistoryOpen).toHaveBeenCalledTimes(1)
  })
})

import {Card} from '@sanity/ui'
import {type DocumentGroupEvent, type EditDocumentVersionEvent, LocaleProvider} from 'sanity'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {EventsTimeline} from '../EventsTimeline'

const BASE_TIME = Date.parse('2020-06-15T12:00:00.000Z')
const secondsBefore = (seconds: number) => new Date(BASE_TIME - seconds * 1000).toISOString()

// An edit event grouping 36 transactions, 5 seconds apart, newest first: `rev-36` is the group
// itself and the other 35 are listed under it.
const transactions: EditDocumentVersionEvent['transactions'] = Array.from(
  {length: 36},
  (_, index) => ({
    type: 'editTransaction',
    author: 'doug',
    timestamp: secondsBefore(index * 5),
    revisionId: `rev-${36 - index}`,
  }),
)

function editEvent(overrides: Partial<EditDocumentVersionEvent>): EditDocumentVersionEvent {
  return {
    type: 'editDocumentVersion',
    id: 'rev-36',
    revisionId: 'rev-36',
    timestamp: transactions[0].timestamp,
    author: 'doug',
    contributors: ['doug'],
    documentId: 'drafts.article-1',
    documentVariantType: 'draft',
    transactions,
    ...overrides,
  }
}

const EVENTS: DocumentGroupEvent[] = [
  editEvent({}),
  ...transactions.slice(1).map((transaction) =>
    editEvent({
      id: transaction.revisionId,
      revisionId: transaction.revisionId,
      timestamp: transaction.timestamp,
      transactions: [transaction],
      parentId: 'rev-36',
      isTransaction: true,
    }),
  ),
  editEvent({
    id: 'older',
    revisionId: 'older',
    timestamp: secondsBefore(3600),
    transactions: [
      {
        type: 'editTransaction',
        author: 'doug',
        timestamp: secondsBefore(3600),
        revisionId: 'older',
      },
    ],
  }),
]

function Harness({
  onSelect,
  fetchEventChildren,
  selectedEventId,
}: {
  onSelect: (event: DocumentGroupEvent) => void
  fetchEventChildren: (event: DocumentGroupEvent) => Promise<void>
  selectedEventId?: string
}) {
  return (
    <TestWrapper schemaTypes={[]}>
      <LocaleProvider>
        <Card padding={2} style={{width: 360}}>
          <EventsTimeline
            events={EVENTS}
            fetchEventChildren={fetchEventChildren}
            hasMoreEvents={false}
            listMaxHeight="4000px"
            onLoadMore={() => {}}
            onSelect={onSelect}
            selectedEventId={selectedEventId}
          />
        </Card>
      </LocaleProvider>
    </TestWrapper>
  )
}

const rows = () => Array.from(document.querySelectorAll<HTMLElement>('[data-ui="timelineItem"]'))
const rowFor = (timestamp: string) =>
  document.querySelector<HTMLElement>(
    `[data-ui="timelineItem"][data-chunk-timestamp="${timestamp}"]`,
  )

describe('EventsTimeline', () => {
  it('expands a grouped edit event into its transactions, 10 first and 20 more per "Show more"', async () => {
    const onSelect = vi.fn()
    const fetchEventChildren = vi.fn(() => Promise.resolve())
    void render(<Harness onSelect={onSelect} fetchEventChildren={fetchEventChildren} />)

    await expect.poll(() => rows().length).toBe(2)
    const expandButton = document
      .querySelector('[data-sanity-icon="chevron-left"]')!
      .closest('button')!
    await userEvent.click(expandButton)

    // Expanding freezes the group in the store (nothing is fetched for edit events).
    expect(fetchEventChildren).toHaveBeenCalledWith(EVENTS[0])
    await expect.poll(() => rows().length).toBe(1 + 10 + 1)
    const showMore = page.getByTestId('timeline-show-more-button')
    await expect.element(showMore).toBeVisible()
    await expect.element(showMore).toHaveTextContent('Show more')

    // The transactions are nested one level deeper, and tell their time down to the second.
    const group = rowFor(transactions[0].timestamp)!
    const firstTransaction = rowFor(transactions[1].timestamp)!
    expect(firstTransaction.getBoundingClientRect().left).toBeGreaterThan(
      group.getBoundingClientRect().left,
    )
    expect(firstTransaction.querySelector('time')!.textContent).toMatch(/^\d{1,2}:\d{2}:55\b/)

    await userEvent.click(showMore)
    await expect.poll(() => rows().length).toBe(1 + 30 + 1)
    await userEvent.click(page.getByTestId('timeline-show-more-button'))
    await expect.poll(() => rows().length).toBe(1 + 35 + 1)
    await expect.element(page.getByTestId('timeline-show-more-button')).not.toBeInTheDocument()

    await userEvent.click(rowFor(transactions[20].timestamp)!)
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({id: 'rev-16', parentId: 'rev-36', isTransaction: true}),
    )
  })

  it('opens with the group of a selected transaction expanded far enough to show it', async () => {
    const fetchEventChildren = vi.fn(() => Promise.resolve())
    void render(
      <Harness
        onSelect={vi.fn()}
        fetchEventChildren={fetchEventChildren}
        selectedEventId="rev-5"
      />,
    )

    // rev-5 is the 31st listed transaction: 10 + 20 + 20 revealed shows all 35 of them.
    await expect.poll(() => rows().length).toBe(1 + 35 + 1)
    const isPressed = (row: HTMLElement) => row.hasAttribute('data-pressed')
    expect(isPressed(rowFor(transactions[31].timestamp)!)).toBe(true)
    expect(rows().filter(isPressed)).toHaveLength(1)
    // The group expanded for the selection is frozen too.
    expect(fetchEventChildren).toHaveBeenCalledWith(EVENTS[0])
  })
})

import {configure} from '@chromatic-com/vitest'
import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {type ComponentProps} from 'react'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {ListArrayInput} from '../ListArrayInput'

function ListArraySchemaInput(props: ComponentProps<typeof ListArrayInput>) {
  return <ListArrayInput {...props} />
}

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'listItems',
        title: 'List items',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'listCard',
            fields: [defineField({type: 'string', name: 'title', title: 'Title'})],
          }),
        ],
        components: {input: ListArraySchemaInput},
      }),
    ],
  }),
]

function ListArrayInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm />
    </TestWrapper>
  )
}

// More items than the default limit of four, so the array renders collapsed.
const LONG_DOCUMENT: SanityDocument = {
  _id: 'list-array-input-long',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'list-array-input-long-rev',
  listItems: Array.from({length: 7}, (_, index) => ({
    _key: `item-${index}`,
    _type: 'listCard',
    title: `List card ${index + 1}`,
  })),
}

function LongListArrayInputHarness(props: {readOnly?: boolean}) {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm document={LONG_DOCUMENT} readOnly={props.readOnly} />
    </TestWrapper>
  )
}

// The card that wraps the item list and the "Show all / fewer items" toggle: the array's
// upload target (`UploadTargetCard`), whose tone follows the input's read-only state.
function listCard(): HTMLElement | null {
  return (
    document
      .querySelector('[data-testid="array-items-toggle"]')
      ?.closest<HTMLElement>('[data-test-id="file-target"]') ?? null
  )
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

describe('list array input', () => {
  test('renders an empty list array', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ListArrayInputHarness />)

    await expect.element(page.getByText('List items')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders a long list array collapsed', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<LongListArrayInputHarness />)

    await expect.element(page.getByText('List card 4')).toBeVisible()
    await expect.element(page.getByText('List card 5')).not.toBeInTheDocument()
    await expect.element(page.getByRole('button', {name: /Show all 7 items/})).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders a long list array expanded', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<LongListArrayInputHarness />)

    await page.getByRole('button', {name: /Show all 7 items/}).click()

    await expect.element(page.getByText('List card 7')).toBeVisible()
    await expect.element(page.getByRole('button', {name: /Show fewer items/})).toBeVisible()
    await settleChromaticEndState()
  })

  // Browser scroll anchoring reacts to rows moving when the rendered range changes, and its scroll
  // correction changes the range again, so the list could keep jumping after scrolling stopped.
  test('keeps the virtualized list geometry stable while scrolling through it', async () => {
    configure({disableAutoSnapshot: true})
    void render(<LongListArrayInputHarness />)

    await page.getByRole('button', {name: /Show all 7 items/}).click()
    await expect.element(page.getByText('List card 7')).toBeInTheDocument()

    const scroller = document.querySelector<HTMLElement>('[data-testid="document-panel-scroller"]')!
    scroller.style.scrollBehavior = 'auto'
    // Short enough that only some of the rows are rendered at a time
    scroller.style.height = '160px'

    const content = document.querySelector<HTMLElement>('[data-ui="ArrayInput__content"]')!
    const rows = () => [...content.querySelectorAll<HTMLElement>('[data-index]')]
    await expect.poll(() => rows().length).toBeLessThan(7)
    const listCard = rows()[0].parentElement!.closest<HTMLElement>('[data-ui="Card"]')!

    expect(getComputedStyle(listCard).overflowAnchor).toBe('none')

    const cardHeights = new Set<number>()
    const rowOffsets = new Map<string, Set<number>>()
    const renderedCounts = new Set<number>()
    for (let top = 0; top <= scroller.scrollHeight - scroller.clientHeight; top += 10) {
      scroller.scrollTop = top
      await nextFrame()
      await nextFrame()

      const cardRect = listCard.getBoundingClientRect()
      cardHeights.add(Math.round(cardRect.height))
      renderedCounts.add(rows().length)
      for (const row of rows()) {
        const offsets = rowOffsets.get(row.dataset.index!) ?? new Set<number>()
        offsets.add(Math.round(row.getBoundingClientRect().top - cardRect.top))
        rowOffsets.set(row.dataset.index!, offsets)
      }
    }

    // The scroll passed through different rendered ranges
    expect(renderedCounts.size).toBeGreaterThan(1)
    expect(rowOffsets.size).toBe(7)
    // Which rows are rendered must not move the list's size or the position of any row in it
    expect([...cardHeights]).toHaveLength(1)
    for (const [index, offsets] of rowOffsets) {
      expect({index, offsets: [...offsets]}).toEqual({index, offsets: [expect.any(Number)]})
    }
  })

  test('blends the list card into the form once a read-only form becomes editable', async () => {
    const {settleChromaticEndState} = testHelpers()
    // A document pair replayed from cache mounts the form read-only and flips it to editable
    // when the fresh snapshot arrives; the card must follow instead of keeping the read-only tone.
    const {rerender} = await render(<LongListArrayInputHarness readOnly />)

    await expect.element(page.getByRole('button', {name: /Show all 7 items/})).toBeVisible()
    await expect.poll(() => listCard()?.getAttribute('data-tone')).toBe('transparent')

    await rerender(<LongListArrayInputHarness readOnly={false} />)

    await expect.element(page.getByRole('button', {name: /Add item/})).toBeVisible()
    await expect.poll(() => listCard()?.getAttribute('data-tone')).toBe('default')
    const card = listCard()!
    const formSurface = card.parentElement!.closest<HTMLElement>('[data-ui="Card"]')!
    expect(getComputedStyle(card).backgroundColor).toBe(
      getComputedStyle(formSurface).backgroundColor,
    )
    await settleChromaticEndState()
  })
})

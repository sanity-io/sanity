import {configure} from '@chromatic-com/vitest'
import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

// Enough fields above `friends` that it is out of view when an animal's dialog opens, so
// scrolling to it and back to the top is observable.
const FILLER_FIELDS = Array.from({length: 12}, (_, index) =>
  defineField({type: 'string', name: `filler${index}`, title: `Filler ${index + 1}`}),
)

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'animals',
        title: 'Animals',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'animal',
            fields: [
              defineField({type: 'string', name: 'name', title: 'Name'}),
              ...FILLER_FIELDS,
              defineField({
                type: 'array',
                name: 'friends',
                title: 'Friends',
                of: [
                  defineArrayMember({
                    type: 'object',
                    name: 'friend',
                    fields: [
                      defineField({type: 'string', name: 'name', title: 'Name'}),
                      ...FILLER_FIELDS,
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  }),
]

const DOCUMENT: SanityDocument = {
  _id: 'dialog-breadcrumbs',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'dialog-breadcrumbs-rev',
  animals: [
    {
      _key: 'whale',
      _type: 'animal',
      name: 'Blue whale',
      friends: [{_key: 'dolphin', _type: 'friend', name: 'Dolphin'}],
    },
  ],
}

const WHALE_FIELD = 'field-animals[_key=="whale"]'
const FRIENDS_FIELD = `${WHALE_FIELD}.friends`

function DialogBreadcrumbsHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm
        document={DOCUMENT}
        openPath={['animals', {_key: 'whale'}, 'friends', {_key: 'dolphin'}]}
      />
    </TestWrapper>
  )
}

function visibleDialogs(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-testid="nested-object-dialog"]'),
  ).filter((dialog) =>
    // Dialogs behind the open one stay mounted with a transparent card.
    dialog.querySelector('[data-ui="DialogCard"]')?.checkVisibility({opacityProperty: true}),
  )
}

function scrollParent(element: Element): HTMLElement {
  let node = element.parentElement
  while (node) {
    const {overflowY} = getComputedStyle(node)
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node
    }
    node = node.parentElement
  }
  throw new Error('No scrollable ancestor')
}

function field(testId: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-testid='${testId}']`)
  if (!element) throw new Error(`Missing ${testId}`)
  return element
}

function focusedFieldTestId(): string | null {
  return (
    document.activeElement?.closest('[data-testid^="field-"]')?.getAttribute('data-testid') ?? null
  )
}

function breadcrumb(name: string) {
  return page.getByTestId(`breadcrumb-item-${name}`).last()
}

async function openDolphin() {
  void render(<DialogBreadcrumbsHarness />)
  await expect.poll(() => visibleDialogs().length).toBe(1)
  await expect.element(breadcrumb('dolphin')).toHaveAttribute('aria-current', 'location')
}

describe('dialog breadcrumbs', () => {
  configure({disableAutoSnapshot: true})

  test('a field breadcrumb shows the dialog that contains the field and focuses it', async () => {
    await openDolphin()

    await breadcrumb('friends').click()

    await expect.poll(focusedFieldTestId).toBe(FRIENDS_FIELD)
    await expect.element(breadcrumb('blue-whale')).toHaveAttribute('aria-current', 'location')
    const scroller = scrollParent(field(FRIENDS_FIELD))
    await expect.poll(() => scroller.scrollTop).toBeGreaterThan(0)
  })

  test('the breadcrumb of an item behind the open dialog shows its dialog scrolled to the top', async () => {
    await openDolphin()
    const whaleScroller = scrollParent(field(FRIENDS_FIELD))
    whaleScroller.scrollTop = whaleScroller.scrollHeight
    await expect.poll(() => whaleScroller.scrollTop).toBeGreaterThan(0)

    await breadcrumb('blue-whale').click()

    await expect.element(breadcrumb('blue-whale')).toHaveAttribute('aria-current', 'location')
    await expect.poll(() => whaleScroller.scrollTop).toBe(0)
    await expect.poll(() => visibleDialogs().length).toBe(1)
  })

  test('the breadcrumb of the open dialog keeps it open and scrolls it to the top', async () => {
    await openDolphin()
    const dialog = visibleDialogs()[0]
    const scroller = scrollParent(dialog.querySelector('[data-testid^="field-"]')!)
    scroller.scrollTop = scroller.scrollHeight
    await expect.poll(() => scroller.scrollTop).toBeGreaterThan(0)

    await breadcrumb('dolphin').click()

    await expect.poll(() => scroller.scrollTop).toBe(0)
    expect(visibleDialogs()).toEqual([dialog])
    await expect.element(breadcrumb('dolphin')).toHaveAttribute('aria-current', 'location')
  })

  test('a document field breadcrumb closes the dialogs and focuses the field', async () => {
    await openDolphin()

    await breadcrumb('animals').click()

    await expect.poll(() => visibleDialogs().length).toBe(0)
    await expect.poll(focusedFieldTestId).toBe('field-animals')
  })
})

// A recursive type, deep enough that the trail collapses into the overflow ("...") menu.
const NESTED_SCHEMA = [
  defineType({
    type: 'object',
    name: 'node',
    fields: [
      defineField({type: 'string', name: 'name', title: 'Name'}),
      defineField({
        type: 'array',
        name: 'children',
        title: 'Children',
        of: [defineArrayMember({type: 'node'})],
      }),
    ],
  }),
  defineType({
    // `TestForm` always edits the `test` document type.
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'nodes',
        title: 'Nodes',
        of: [defineArrayMember({type: 'node'})],
      }),
    ],
  }),
]

const NESTED_DOCUMENT: SanityDocument = {
  _id: 'dialog-breadcrumbs-overflow',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'dialog-breadcrumbs-overflow-rev',
  nodes: [
    {
      _key: 'n1',
      _type: 'node',
      name: 'Level one',
      children: [
        {
          _key: 'n2',
          _type: 'node',
          name: 'Level two',
          children: [
            {
              _key: 'n3',
              _type: 'node',
              name: 'Level three',
              children: [{_key: 'n4', _type: 'node', name: 'Level four'}],
            },
          ],
        },
      ],
    },
  ],
}

describe('dialog breadcrumbs overflow menu', () => {
  configure({disableAutoSnapshot: true})

  test('shows the collapsed breadcrumbs and navigates to the chosen one', async () => {
    void render(
      <TestWrapper schemaTypes={NESTED_SCHEMA}>
        <TestForm
          document={NESTED_DOCUMENT}
          openPath={[
            'nodes',
            {_key: 'n1'},
            'children',
            {_key: 'n2'},
            'children',
            {_key: 'n3'},
            'children',
            {_key: 'n4'},
          ]}
        />
      </TestWrapper>,
    )
    await expect.element(breadcrumb('level-four')).toHaveAttribute('aria-current', 'location')

    const overflowButton = page.getByRole('button', {name: 'More breadcrumb items'}).last()
    await overflowButton.click()

    // The menu renders in the dialog header, outside the dialog's scroll box. It must not be
    // treated as a hidden reference and rendered with `display: none`.
    const collapsedItem = page.getByRole('menuitem', {name: 'Level two'})
    await expect.element(collapsedItem).toBeVisible()

    await collapsedItem.click()

    await expect.element(breadcrumb('level-two')).toHaveAttribute('aria-current', 'location')
  })
})

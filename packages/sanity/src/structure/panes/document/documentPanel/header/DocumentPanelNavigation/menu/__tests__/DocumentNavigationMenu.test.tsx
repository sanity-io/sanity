import {act, render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode, useState} from 'react'
import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../../../test/testUtils/TestProvider'
import {MenuItem} from '../../../../../../../../ui-components/menuItem/MenuItem'
import {DocumentNavigationMenu} from '../DocumentNavigationMenu'

let wrapper: React.ComponentType<{children: React.ReactNode}>

const ITEMS = ['Alpha', 'Beta']

/** Owns the filter, the way the variants and releases menus do, and filters the items by text. */
function FilteredMenu(props: {documentItems: string[]; leadingItem?: string}) {
  const {documentItems, leadingItem} = props
  const [filterQuery, setFilterQuery] = useState('')
  const matches = (text: string) => text.toLowerCase().includes(filterQuery.trim().toLowerCase())
  const toItem = (text: string): ReactNode => (
    <MenuItem data-testid={`item-${text}`} key={text} text={text} />
  )

  return (
    <DocumentNavigationMenu
      testId="test-menu"
      button={<button type="button">Open</button>}
      filterPlaceholder="Find"
      filterQuery={filterQuery}
      onFilterChange={setFilterQuery}
      leadingItems={leadingItem && matches(leadingItem) ? toItem(leadingItem) : null}
      sections={[
        {
          key: 'document',
          label: 'In the document',
          items: documentItems.filter(matches).map(toItem),
          alwaysShow: true,
          tooltip: documentItems.length === 0 ? 'Nothing here yet.' : undefined,
        },
        {
          key: 'other',
          label: 'Other',
          items: ITEMS.filter((item) => !documentItems.includes(item) && matches(item)).map(toItem),
        },
      ]}
    />
  )
}

async function openMenu() {
  await userEvent.click(await screen.findByRole('button', {name: 'Open'}))
  return screen.findByTestId('test-menu')
}

beforeAll(async () => {
  wrapper = await createTestProvider()
})

// The test environment mocks `matchMedia` as matching nothing, which reads as a touch device
function stubPointer({finePointerWithHover}: {finePointerWithHover: boolean}) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: finePointerWithHover,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

describe('DocumentNavigationMenu', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the width the menu had when it opened while the filter narrows the list', async () => {
    // jsdom has no layout: the menu "measures" 320px when it opens
    const offsetWidth = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(320)
    try {
      render(<FilteredMenu documentItems={['Alpha']} />, {wrapper})

      const menu = await openMenu()
      await waitFor(() => expect(menu).toHaveStyle({width: '320px', minWidth: '320px'}))

      // The rows that are left are narrower, so the menu would shrink without the lock
      offsetWidth.mockReturnValue(200)
      await userEvent.type(screen.getByPlaceholderText('Find'), 'alp')

      expect(within(menu).queryByTestId('item-Beta')).not.toBeInTheDocument()
      expect(menu).toHaveStyle({width: '320px', minWidth: '320px', maxWidth: '320px'})
    } finally {
      offsetWidth.mockRestore()
    }
  })

  it('focuses the filter when the menu opens, and the arrow keys still move into the list', async () => {
    stubPointer({finePointerWithHover: true})
    render(<FilteredMenu documentItems={['Alpha']} />, {wrapper})

    await openMenu()
    await waitFor(() => expect(screen.getByPlaceholderText('Find')).toHaveFocus())

    await userEvent.keyboard('{ArrowDown}')

    await waitFor(() => expect(screen.getByPlaceholderText('Find')).not.toHaveFocus())
    expect(document.activeElement).toHaveAttribute('data-ui', 'MenuItem')
  })

  it('leaves the filter alone on a touch device, where focus opens the on-screen keyboard', async () => {
    stubPointer({finePointerWithHover: false})
    render(<FilteredMenu documentItems={['Alpha']} />, {wrapper})

    await openMenu()
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)))

    expect(screen.getByPlaceholderText('Find')).not.toHaveFocus()
  })

  it('shows an always-shown section while it is empty, with its tooltip', async () => {
    render(<FilteredMenu documentItems={[]} />, {wrapper})

    const menu = await openMenu()

    const documentSection = within(menu).getByTestId('test-menu-section-document')
    expect(documentSection).toHaveTextContent('In the document')
    expect(
      within(documentSection).getByTestId('test-menu-section-document-tooltip'),
    ).toHaveAccessibleName('Nothing here yet.')
    expect(within(menu).getByTestId('test-menu-section-other')).toHaveTextContent('Other')
  })

  it('hides a section with no items unless it is always shown', async () => {
    render(<FilteredMenu documentItems={ITEMS} />, {wrapper})

    const menu = await openMenu()

    expect(within(menu).getByTestId('test-menu-section-document')).toBeInTheDocument()
    expect(within(menu).queryByTestId('test-menu-section-other')).toBeNull()
  })

  it('hides the empty sections while filtering, and says when nothing matches', async () => {
    render(<FilteredMenu documentItems={[]} />, {wrapper})

    const menu = await openMenu()
    const input = within(menu).getByPlaceholderText('Find')

    await userEvent.type(input, 'alp')
    expect(within(menu).queryByTestId('test-menu-section-document')).toBeNull()
    expect(within(menu).getByTestId('item-Alpha')).toBeInTheDocument()

    await userEvent.clear(input)
    await userEvent.type(input, 'zzz')
    expect(within(menu).getByTestId('test-menu-no-matches')).toHaveTextContent(
      'Nothing matches "zzz"',
    )
  })

  it('counts a matching leading item as a match', async () => {
    render(<FilteredMenu documentItems={[]} leadingItem="Default" />, {wrapper})

    const menu = await openMenu()
    await userEvent.type(within(menu).getByPlaceholderText('Find'), 'def')

    expect(within(menu).getByTestId('item-Default')).toBeInTheDocument()
    expect(within(menu).queryByTestId('test-menu-no-matches')).toBeNull()
  })

  it('clears the filter when the menu closes', async () => {
    render(<FilteredMenu documentItems={[]} />, {wrapper})

    const menu = await openMenu()
    await userEvent.type(within(menu).getByPlaceholderText('Find'), 'alp')
    await userEvent.keyboard('{Escape}')

    const reopened = await openMenu()
    expect(within(reopened).getByPlaceholderText('Find')).toHaveValue('')
  })
})

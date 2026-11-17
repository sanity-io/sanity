import {render, screen, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode, useState} from 'react'
import {beforeAll, describe, expect, it} from 'vitest'

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

describe('DocumentNavigationMenu', () => {
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

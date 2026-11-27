import {configure} from '@chromatic-com/vitest'
import {TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {Button} from '../../button/Button'
import {MenuItem} from '../../menuItem/MenuItem'
import {MenuButton} from '../MenuButton'
import {useFocusSearchOnOpen} from '../useFocusSearchOnOpen'

// Keyboard behaviour, not a visual state worth archiving.
configure({disableAutoSnapshot: true})

const ROWS = ['Published', 'Drafts', 'Scheduled drafts']

/** A navbar perspective menu in short: the search field, then rows, one of them selected. */
function Harness({selected = 'Drafts'}: {selected?: string}) {
  const focusSearchField = useFocusSearchOnOpen()
  return (
    <TestWrapper schemaTypes={[]}>
      <MenuButton
        id="search-menu"
        button={<Button text="Open" />}
        menu={
          <Menu>
            <TextInput ref={focusSearchField} data-testid="search" />
            {ROWS.map((row) => (
              <MenuItem key={row} text={row} selected={row === selected} />
            ))}
          </Menu>
        }
      />
    </TestWrapper>
  )
}

async function openWithKeyboard(selected?: string) {
  void render(<Harness selected={selected} />)
  const trigger = page.getByRole('button', {name: 'Open'})
  await expect.element(trigger).toBeVisible()
  trigger.element().focus()
  await userEvent.keyboard('{Enter}')
  await expect.poll(() => document.activeElement?.getAttribute('data-testid')).toBe('search')
}

describe('useFocusSearchOnOpen: arrow keys from the search field', () => {
  it('ArrowDown moves to the first row, after the menu was opened from the keyboard', async () => {
    await openWithKeyboard()
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(() => document.activeElement?.textContent).toBe('Published')
    // From there the menu moves on as usual
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(() => document.activeElement?.textContent).toBe('Drafts')
  })

  it('ArrowDown moves to the first row when that row is the selected one', async () => {
    await openWithKeyboard('Published')
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(() => document.activeElement?.textContent).toBe('Published')
  })

  it('ArrowUp moves to the last row', async () => {
    await openWithKeyboard()
    await userEvent.keyboard('{ArrowUp}')
    await expect.poll(() => document.activeElement?.textContent).toBe('Scheduled drafts')
  })
})

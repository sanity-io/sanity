import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {VariantsMenuStory} from './VariantsMenuStory'

describe('VariantsMenu search field focus', () => {
  it('focuses the search field each time the menu opens, not only the first time', async () => {
    void render(<VariantsMenuStory />)
    const trigger = page.getByTestId('variants-nav-menu-button')
    const search = page.getByPlaceholder('Search variant definitions…')

    // First open: the menu mounts, then the field takes focus once the menu has settled
    await trigger.click()
    await expect.element(search).toHaveFocus()

    // Close it. The menu stays mounted, hidden, so the field's ref callback does not run again
    await userEvent.keyboard('{Escape}')
    await expect.element(page.getByTestId('variants-nav-menu')).not.toBeVisible()
    expect(document.activeElement).not.toBe(search.element())

    // Second open: the field is visible again and takes the focus again
    await trigger.click()
    await expect.element(page.getByTestId('variants-nav-menu')).toBeVisible()
    await expect.element(search).toHaveFocus()

    // And a third, to show it does not depend on being the first reopen
    await userEvent.keyboard('{Escape}')
    await expect.element(page.getByTestId('variants-nav-menu')).not.toBeVisible()
    await trigger.click()
    await expect.element(search).toHaveFocus()
  })
})

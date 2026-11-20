import {configure} from '@chromatic-com/vitest'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {expectStable} from '../../../../../../test/browser/testHelpers'
import {VariantsMenuStory} from './VariantsMenuStory'

// Measurements, not visual states worth archiving.
configure({disableAutoSnapshot: true})

const menu = () => page.getByTestId('variants-nav-menu').element() as HTMLElement

/** The menu's scrolling list, kept short so its three rows overflow it. */
function list(): HTMLElement {
  const scroller = [...menu().querySelectorAll<HTMLElement>('*')].find(
    (element) => getComputedStyle(element).overflowY === 'auto',
  )
  if (!scroller) throw new Error('list not found')
  return scroller
}

function geometry() {
  const field = menu().querySelector('[data-ui="TextInput"]')!.getBoundingClientRect()
  const box = list().getBoundingClientRect()
  const rows = [...list().querySelectorAll('[data-ui="MenuItem"]')].map((row) =>
    row.getBoundingClientRect(),
  )
  const firstVisible = rows.find((row) => row.bottom > box.top + 0.5)!
  return {fieldBottom: field.bottom, firstVisibleTop: firstVisible.top}
}

async function open() {
  await page.getByTestId('variants-nav-menu-button').click()
  await expect.element(page.getByTestId('variants-nav-menu')).toBeVisible()
  await expectStable(() => `${list().scrollTop}|${JSON.stringify(geometry())}`)
}

async function close() {
  await userEvent.keyboard('{Escape}')
  await expect.element(page.getByTestId('variants-nav-menu')).not.toBeVisible()
}

/** Leaves the list scrolled so the top row is cut in half under the search field. */
function scrollToHalfRow() {
  const row = list().querySelector('[data-ui="MenuItem"]')!.getBoundingClientRect()
  list().scrollTop = row.height / 2
}

// The selected-row case is covered with a harness in
// `ui-components/menuButton/__tests__/useMenuOverflow.browser.test.tsx`: this story has no router,
// so choosing a variant does not stick.
describe('VariantsMenu: reopening a scrolled menu', () => {
  it('reopens at the top with the default variant selected', async () => {
    void render(<VariantsMenuStory />)
    await open()
    list().style.maxHeight = '80px'
    scrollToHalfRow()
    await close()
    await open()

    expect(list().scrollTop).toBe(0)
    const {fieldBottom, firstVisibleTop} = geometry()
    expect(Math.abs(firstVisibleTop - (fieldBottom + 8))).toBeLessThanOrEqual(1)
  })
})

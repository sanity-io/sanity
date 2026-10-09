import {BoldIcon} from '@sanity/icons/Bold'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cloneElement, type ReactNode} from 'react'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable, withSilentIntersectionObserver} from '../../../../../test/browser/testHelpers'
import {Button} from '../../../../ui-components/button/Button'
import {CollapseMenu} from '../CollapseMenu'
import {CollapseMenuButton} from '../CollapseMenuButton'

const theme = buildTheme()

const overflowButton = (
  <Button
    aria-label="More actions"
    icon={EllipsisHorizontalIcon}
    mode="bleed"
    tooltipProps={null}
  />
)

// Four buttons at their natural widths: roughly 100px each with their text (the labels below
// are long enough for that in any fallback font), about 25px each collapsed to their icon, 4px
// gaps. 800px fits them expanded, 300px only collapsed (about 112px). 95px fits two collapsed
// next to the overflow button (25px plus a gap), which is part of the row that is measured:
// that leaves about 66px, room for 54px of buttons but not 83px.
const WIDE = 800
const MEDIUM = 300
const NARROW = 95
// Wider than any icon-only button, narrower than any button with its label
const ICON_ONLY_MAX_WIDTH = 60
const NAMES = ['Alpha action', 'Beta action', 'Gamma action', 'Delta action']

function makeButtons(names: string[]) {
  return names.map((name) => (
    <CollapseMenuButton
      aria-label={name}
      icon={BoldIcon}
      key={name}
      mode="bleed"
      text={name}
      tooltipText={name}
    />
  ))
}

function TestMenu(props: {children: ReactNode; collapseText?: boolean; width: number}) {
  const {children, collapseText, width} = props
  return (
    <ThemeProvider theme={theme}>
      <div style={{width}}>
        <CollapseMenu
          collapseText={collapseText}
          data-testid="collapse-menu"
          gap={1}
          menuButtonProps={{button: overflowButton}}
        >
          {children}
        </CollapseMenu>
      </div>
    </ThemeProvider>
  )
}

// The measurement rows are aria-hidden, so role queries only match the painted buttons.
const overflowMenuButton = page.getByRole('button', {name: 'More actions'})
const button = (name: string) => page.getByRole('button', {name})

function paintedWidth(name: string) {
  return button(name).element().getBoundingClientRect().width
}

/** The width the buttons take in a row with the menu's 4px gap, measured and unmounted again */
async function naturalRowWidth(children: ReactNode) {
  const probe = await render(
    <ThemeProvider theme={theme}>
      <div data-testid="probe" style={{display: 'flex', gap: 4, width: 'max-content'}}>
        {children}
      </div>
    </ThemeProvider>,
  )
  const width = document.querySelector('[data-testid="probe"]')!.getBoundingClientRect().width
  await probe.unmount()
  return width
}

/** Which buttons are painted, and whether the overflow button is, as one comparable string */
function paintedSignature() {
  const names = NAMES.filter((name) => button(name).query() !== null)
  return `${names.join(',')}|${overflowMenuButton.query() ? 'overflow' : 'no-overflow'}`
}

describe('CollapseMenu', () => {
  // With the observer silenced for the whole test, what is painted is what the measurement
  // the clones report while mounting decided; before, the row stayed empty until the
  // observer's first entries arrived, a frame or more after the first paint.
  it('paints every button expanded in its first commit when they fit', async () => {
    await withSilentIntersectionObserver(async () => {
      await render(<TestMenu width={WIDE}>{makeButtons(NAMES)}</TestMenu>)

      await expect.element(button('Delta action')).toBeVisible()
      await expect.element(button('Delta action')).toHaveTextContent('Delta action')
      expect(paintedWidth('Delta action')).toBeGreaterThan(ICON_ONLY_MAX_WIDTH)
      await expect.element(overflowMenuButton).not.toBeInTheDocument()
    })
  })

  it('paints the buttons collapsed in its first commit when only their icons fit', async () => {
    await withSilentIntersectionObserver(async () => {
      await render(<TestMenu width={MEDIUM}>{makeButtons(NAMES)}</TestMenu>)

      await expect.element(button('Delta action')).toBeVisible()
      await expect.element(button('Delta action')).toHaveTextContent('')
      expect(paintedWidth('Delta action')).toBeLessThan(ICON_ONLY_MAX_WIDTH)
      await expect.element(overflowMenuButton).not.toBeInTheDocument()
    })
  })

  it('paints the buttons expanded in its first commit when they fit the row but not beside an overflow button', async () => {
    // The band the overflow button's footprint (25px plus a gap) used to decide: measured beside
    // a provisional button, the expanded buttons overflowed and the menu painted collapsed, then
    // switched to expanded once the button was gone and the observer re-measured.
    const expandedWidth = await naturalRowWidth(makeButtons(NAMES))
    const width = Math.ceil(expandedWidth) + 8

    await withSilentIntersectionObserver(async () => {
      await render(<TestMenu width={width}>{makeButtons(NAMES)}</TestMenu>)

      await expect.element(button('Delta action')).toHaveTextContent('Delta action')
      await expect.element(overflowMenuButton).not.toBeInTheDocument()
    })
  })

  it('keeps every button usable when they fit the row but not beside an overflow button, with collapseText off', async () => {
    // With `collapseText` off (the PTE insert menu) the collapsed buttons are as wide as the
    // expanded ones, so in this band the collapsed row, measured beside the overflow button's
    // footprint, reports the last button as overflowing while the expanded row fits. Only the
    // expanded row's verdict applies: every button is painted enabled, without a menu.
    const expandedWidth = await naturalRowWidth(makeButtons(NAMES))
    const width = Math.ceil(expandedWidth) + 8
    const expected = 'Alpha action,Beta action,Gamma action,Delta action|no-overflow'

    await withSilentIntersectionObserver(async () => {
      const {unmount} = await render(
        <TestMenu collapseText={false} width={width}>
          {makeButtons(NAMES)}
        </TestMenu>,
      )

      await expect.element(button('Delta action')).toBeVisible()
      await expect.element(button('Delta action')).toBeEnabled()
      await expect.element(button('Delta action')).toHaveTextContent('Delta action')
      expect(paintedSignature()).toBe(expected)
      await unmount()
    })

    // With the observer live, the first paint holds
    await render(
      <TestMenu collapseText={false} width={width}>
        {makeButtons(NAMES)}
      </TestMenu>,
    )
    await expect.element(button('Delta action')).toBeVisible()
    expect(await expectStable(paintedSignature)).toBe(expected)
  })

  it('shows the overflow button from its first commit when the collapsed buttons fit the row only without it', async () => {
    // Collapsed buttons that do not all fit share the row with the overflow button, so the last
    // one goes into the menu even though it would fit the row on its own: the first paint is
    // the layout the observer settles on, so nothing moves after it.
    const collapsedWidth = await naturalRowWidth(
      makeButtons(NAMES).map((element) => cloneElement(element, {text: undefined})),
    )
    const width = Math.ceil(collapsedWidth) + 8
    const expected = 'Alpha action,Beta action,Gamma action|overflow'

    await withSilentIntersectionObserver(async () => {
      const {unmount} = await render(<TestMenu width={width}>{makeButtons(NAMES)}</TestMenu>)
      await expect.element(button('Gamma action')).toBeVisible()
      expect(paintedSignature()).toBe(expected)
      await unmount()
    })

    // With the observer live, the first paint holds
    await render(<TestMenu width={width}>{makeButtons(NAMES)}</TestMenu>)
    await expect.element(button('Gamma action')).toBeVisible()
    expect(await expectStable(paintedSignature)).toBe(expected)
  })

  it('moves the buttons that do not fit collapsed into the overflow menu in its first commit', async () => {
    await withSilentIntersectionObserver(async () => {
      await render(<TestMenu width={NARROW}>{makeButtons(NAMES)}</TestMenu>)

      await expect.element(button('Beta action')).toBeVisible()
      expect(paintedWidth('Beta action')).toBeLessThan(ICON_ONLY_MAX_WIDTH)
      await expect.element(overflowMenuButton).toBeVisible()
      await expect.element(button('Gamma action')).not.toBeInTheDocument()
      await expect.element(button('Delta action')).not.toBeInTheDocument()
    })
  })
})

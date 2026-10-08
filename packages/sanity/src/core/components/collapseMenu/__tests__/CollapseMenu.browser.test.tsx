import {BoldIcon} from '@sanity/icons/Bold'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {type ReactNode} from 'react'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {withSilentIntersectionObserver} from '../../../../../test/browser/testHelpers'
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

function TestMenu(props: {children: ReactNode; width: number}) {
  const {children, width} = props
  return (
    <ThemeProvider theme={theme}>
      <div style={{width}}>
        <CollapseMenu
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

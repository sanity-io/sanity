import {configure, takeSnapshot} from '@chromatic-com/vitest'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Button as UIButton} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable, testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {Button} from '../../../../../ui-components/button/Button'
import {MenuButton, type MenuButtonProps} from '../../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {PerspectiveFilter} from '../PerspectiveFilter'

// The perspective bar makes the whole filter pill one touch target by handing
// GlobalPerspectiveMenu / VariantsMenu a full labelled button as their trigger
// instead of the bare chevron they render by default. These tests pin down that
// the swap keeps the menu openable and anchored to the pill, using the same
// MenuButton + popover configuration the real menus use.
const POPOVER: NonNullable<MenuButtonProps['popover']> = {
  __unstable_margins: [0, 0, 32, 0],
  constrainSize: true,
  fallbackPlacements: ['bottom-end'],
  placement: 'bottom-end',
  portal: true,
  tone: 'default',
  zOffset: 3000,
}

const menuFor = (testId: string) => (
  <Menu data-testid={testId}>
    <MenuItem text="Drafts" />
    <MenuItem text="Published" />
  </Menu>
)

function Fixture({withRemove}: {withRemove?: boolean}) {
  return (
    <TestWrapper schemaTypes={[]}>
      {/* The control: the chevron-only trigger the menus ship by default. */}
      <MenuButton
        button={
          <UIButton
            data-testid="control-trigger"
            iconRight={ChevronDownIcon}
            mode="bleed"
            padding={2}
            radius="full"
          />
        }
        id="control-menu"
        menu={menuFor('control-menu-content')}
        popover={POPOVER}
      />

      {/* Ours: a labelled button filling the pill, optionally beside a remove segment. */}
      <PerspectiveFilter
        prefix="Version"
        tone="default"
        onRemove={withRemove ? () => {} : undefined}
        removeLabel="Clear version selection"
      >
        <MenuButton
          button={
            <Button
              data-testid="pill-trigger"
              iconRight={ChevronDownIcon}
              mode="bleed"
              text="Drafts"
            />
          }
          id="pill-menu"
          menu={menuFor('pill-menu-content')}
          popover={POPOVER}
        />
      </PerspectiveFilter>
    </TestWrapper>
  )
}

// One complete rectangle per sample, rounded, so `expectStable` compares the
// whole menu position at once rather than one edge at a time.
const pillMenuBox = () => {
  const el = window.document.querySelector('[data-testid="pill-menu-content"]')
  if (!(el instanceof HTMLElement) || !el.checkVisibility()) return null
  const r = el.getBoundingClientRect()
  return `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}`
}

const parseBox = (box: string) => {
  const [left, top, right, bottom] = box.split(',').map(Number)
  return {left, top, right, bottom}
}

describe('perspective bar filter pill as a menu trigger', () => {
  const {settleChromaticEndState} = testHelpers()

  it('opens the menu from the chevron-only trigger (control)', async () => {
    void render(<Fixture />)

    await page.getByTestId('control-trigger').click()

    await expect.element(page.getByTestId('control-menu-content')).toBeVisible()

    // Park the pointer (it is still on the trigger) and require the menu to
    // stay open and stop moving before the auto snapshot.
    await settleChromaticEndState()
    await expect.element(page.getByTestId('control-menu-content')).toBeVisible()
  })

  it('opens the menu from the labelled pill trigger and keeps it open', async () => {
    // Auto end-state raced the open menu vs a dismissed one across identical
    // Chromatic captures; archive while the menu is visibly open.
    configure({disableAutoSnapshot: true})
    void render(<Fixture />)

    await page.getByTestId('pill-trigger').click()

    await expect.element(page.getByTestId('pill-menu-content')).toBeVisible()
    // Parks the real pointer (so `pill-trigger` is not archived `:hover`ed),
    // requires the open menu to stay open with a stable rectangle, and snaps
    // its Floating UI transform to whole pixels.
    await settleChromaticEndState()
    await expect.element(page.getByTestId('pill-menu-content')).toBeVisible()
    await takeSnapshot('pill-menu-open')
  })

  it('still opens when the pill also renders a remove segment', async () => {
    void render(<Fixture withRemove />)

    await page.getByTestId('pill-trigger').click()

    await expect.element(page.getByTestId('pill-menu-content')).toBeVisible()
    await settleChromaticEndState()
    await expect.element(page.getByTestId('pill-menu-content')).toBeVisible()
  })

  it('anchors the menu to the pill rather than elsewhere on screen', async () => {
    void render(<Fixture />)

    const trigger = page.getByTestId('pill-trigger')
    await trigger.click()
    await expect.element(page.getByTestId('pill-menu-content')).toBeVisible()

    const triggerRect = trigger.element().getBoundingClientRect()

    // The popover is visible before Floating UI has positioned it, so wait for
    // one complete rectangle to hold still, then check the anchoring on that
    // single sample. Below the trigger, and overlapping it horizontally: a menu
    // that has drifted to the other edge of the viewport is the reported symptom.
    // (A fresh Symbol per hidden sample can never match, so a menu that closes
    // times out here instead of passing on a stale rectangle.)
    const stableBox = await expectStable(() => pillMenuBox() ?? Symbol('hidden'))
    if (typeof stableBox !== 'string') throw new Error('pill menu is not visible')
    const menuRect = parseBox(stableBox)
    expect(menuRect.top).toBeGreaterThanOrEqual(triggerRect.top)
    expect(menuRect.right).toBeGreaterThan(triggerRect.left)
    expect(menuRect.left).toBeLessThan(triggerRect.right + 320)

    await settleChromaticEndState()
    await expect.element(page.getByTestId('pill-menu-content')).toBeVisible()
  })
})

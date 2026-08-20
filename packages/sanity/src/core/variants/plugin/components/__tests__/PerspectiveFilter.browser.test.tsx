import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Button as UIButton} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

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

describe('perspective bar filter pill as a menu trigger', () => {
  it('opens the menu from the chevron-only trigger (control)', async () => {
    void render(<Fixture />)

    await page.getByTestId('control-trigger').click()

    await expect.element(page.getByTestId('control-menu-content')).toBeVisible()
  })

  it('opens the menu from the labelled pill trigger and keeps it open', async () => {
    void render(<Fixture />)

    await page.getByTestId('pill-trigger').click()

    await expect.element(page.getByTestId('pill-menu-content')).toBeVisible()
  })

  it('still opens when the pill also renders a remove segment', async () => {
    void render(<Fixture withRemove />)

    await page.getByTestId('pill-trigger').click()

    await expect.element(page.getByTestId('pill-menu-content')).toBeVisible()
  })

  it('anchors the menu to the pill rather than elsewhere on screen', async () => {
    void render(<Fixture />)

    const trigger = page.getByTestId('pill-trigger')
    await trigger.click()
    await expect.element(page.getByTestId('pill-menu-content')).toBeVisible()

    const triggerRect = trigger.element().getBoundingClientRect()
    const menuRect = page.getByTestId('pill-menu-content').element().getBoundingClientRect()

    // Below the trigger, and overlapping it horizontally: a menu that has
    // drifted to the other edge of the viewport is the reported symptom.
    expect(menuRect.top).toBeGreaterThanOrEqual(triggerRect.top)
    expect(menuRect.right).toBeGreaterThan(triggerRect.left)
    expect(menuRect.left).toBeLessThan(triggerRect.right + 320)
  })
})

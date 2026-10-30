import {Button as UIButton} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {RhombusIcon} from '../../../components/temporary-icons/Rhombus'
import {GlobalPerspectiveButton} from '../GlobalPerspectiveButton'
import {suggestIconColor} from '../variants/VariantsNav.css'

const LONG_LABEL = 'A release title long enough to overflow the drawer pill'
const CONTAINER_WIDTH = 220

describe('GlobalPerspectiveButton', () => {
  it('truncates a long label in a full-width chip and keeps the caret inside it', async () => {
    void render(
      <TestWrapper schemaTypes={[]}>
        <div style={{width: CONTAINER_WIDTH}}>
          <GlobalPerspectiveButton
            data-testid="full-width-trigger"
            fullWidth
            handleClearPerspective={noop}
            icon={<RhombusIcon className={suggestIconColor} />}
            text={LONG_LABEL}
          />
        </div>
      </TestWrapper>,
    )

    const trigger = page.getByTestId('full-width-trigger')
    await expect.element(trigger).toBeVisible()
    const chip = trigger.element().closest('[data-ui="GlobalPerspectiveButton"]')
    if (!chip) throw new Error('GlobalPerspectiveButton not found')
    const caret = trigger.element().querySelector('[data-sanity-icon="chevron-down"]')
    if (!caret) throw new Error('caret not found')
    const label = [...trigger.element().querySelectorAll('*')].find(
      (node) =>
        node.textContent === LONG_LABEL && getComputedStyle(node).textOverflow === 'ellipsis',
    )
    if (!label) throw new Error('truncating label not found')

    await expectStable(() => `${chip.getBoundingClientRect().width},${label.clientWidth}`)
    expect(Math.round(chip.getBoundingClientRect().width)).toBe(CONTAINER_WIDTH)
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth)
    // `text-overflow` only shortens inline text. Wrapped in the width animation's inline-block,
    // the label is clipped mid-glyph with no ellipsis.
    expect(label.firstElementChild).toBeNull()
    expect(caret.getBoundingClientRect().right).toBeLessThanOrEqual(
      trigger.element().getBoundingClientRect().right,
    )
  })

  it('is as tall as a default button, with the card border outside the controls', async () => {
    void render(
      <TestWrapper schemaTypes={[]}>
        {/* `padding={3}` and text size 1 are the `@sanity/ui` button defaults. */}
        <UIButton data-testid="default-button" mode="default" padding={3} text="Drafts" />
        <GlobalPerspectiveButton
          data-testid="pill-trigger"
          handleClearPerspective={noop}
          icon={<RhombusIcon className={suggestIconColor} />}
          text="Drafts"
        />
      </TestWrapper>,
    )

    await expect.element(page.getByTestId('pill-trigger')).toBeVisible()
    const trigger = page.getByTestId('pill-trigger').element()
    const chip = trigger.closest('[data-ui="GlobalPerspectiveButton"]')
    if (!chip) throw new Error('GlobalPerspectiveButton not found')
    const clear = page.getByTestId('global-perspective-button-clear').element()
    const defaultButton = page.getByTestId('default-button').element()

    const heightOf = (element: Element) => Math.round(element.getBoundingClientRect().height)
    const verticalBorder = (element: Element) => {
      const style = getComputedStyle(element)
      return Math.round(parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth))
    }

    // Held still over several re-reads: a font load can move these on the next frame.
    const heights = await expectStable(
      () =>
        `${heightOf(chip)},${heightOf(trigger)},${heightOf(clear)},${heightOf(defaultButton)},${verticalBorder(chip)}`,
    )
    const [chipHeight, triggerHeight, clearHeight, buttonHeight, border] = heights
      .split(',')
      .map(Number)

    expect(buttonHeight).toBeGreaterThan(0)
    expect(border).toBeGreaterThan(0)
    expect(chipHeight).toBe(buttonHeight)
    expect(triggerHeight).toBe(chipHeight - border)
    expect(clearHeight).toBe(triggerHeight)
  })
})

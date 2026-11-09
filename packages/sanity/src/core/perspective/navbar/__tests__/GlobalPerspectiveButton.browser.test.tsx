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
  it('cuts a long label so the chip does not push the navbar aside, and keeps it in full for the tooltip', async () => {
    const longName = 'Regional Marketing Launch: birmingham / rich-customers / brand-z'
    void render(
      <TestWrapper schemaTypes={[]}>
        <GlobalPerspectiveButton
          data-testid="cut-trigger"
          icon={<RhombusIcon className={suggestIconColor} />}
          text={longName}
          pickerLabel="Variant"
        />
      </TestWrapper>,
    )

    const trigger = page.getByTestId('cut-trigger')
    await expect.element(trigger).toHaveTextContent('Regional Marketing Launch: birmi…')
    await expect.element(trigger).toHaveAccessibleName(longName)
    await trigger.hover()
    await expect.element(page.getByText('Variant', {exact: true})).toBeVisible()
    await expect.element(page.getByText(longName)).toBeVisible()
  })

  it('shows the picker and its current value in the tooltip when the label is short', async () => {
    void render(
      <TestWrapper schemaTypes={[]}>
        <GlobalPerspectiveButton
          data-testid="short-trigger"
          icon={<RhombusIcon className={suggestIconColor} />}
          text="Default"
          pickerLabel="Variant"
        />
      </TestWrapper>,
    )

    const trigger = page.getByTestId('short-trigger')
    await expect.element(trigger).toHaveTextContent('Default')
    await trigger.hover()
    await expect.element(page.getByText('Variant', {exact: true})).toBeVisible()
    // The chip's label and the tooltip's current value
    await expect.poll(() => page.getByText('Default', {exact: true}).elements()).toHaveLength(2)
  })
})

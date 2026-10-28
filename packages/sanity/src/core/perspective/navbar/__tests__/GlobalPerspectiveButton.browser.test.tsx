import {configure} from '@chromatic-com/vitest'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {RhombusIcon} from '../../../components/temporary-icons/Rhombus'
import {GlobalPerspectiveButton} from '../GlobalPerspectiveButton'
import {suggestIconColor} from '../variants/VariantsNav.css'

const {settleChromaticEndState} = testHelpers()

const radiusOf = (element: Element, corner: 'borderTopLeftRadius' | 'borderTopRightRadius') =>
  parseFloat(getComputedStyle(element)[corner])

describe('GlobalPerspectiveButton focus', () => {
  it('follows the pill instead of a square clipped at the corners', async () => {
    void render(
      <TestWrapper schemaTypes={[]}>
        <GlobalPerspectiveButton
          data-testid="pill-trigger"
          icon={<RhombusIcon className={suggestIconColor} />}
          text="All users"
        />
      </TestWrapper>,
    )

    const trigger = page.getByTestId('pill-trigger')
    await expect.element(trigger).toBeVisible()
    trigger.element().focus()

    const button = trigger.element()
    const height = button.getBoundingClientRect().height
    // Half the control's height is a semicircle cap. Anything smaller leaves a
    // square corner for the card's overflow to clip out of the focus ring.
    expect(radiusOf(button, 'borderTopLeftRadius')).toBeGreaterThanOrEqual(height / 2)
    expect(radiusOf(button, 'borderTopRightRadius')).toBeGreaterThanOrEqual(height / 2)

    await settleChromaticEndState()
  })
})

describe('GlobalPerspectiveButton with a clear control', () => {
  // The clear control's tooltip opens on focus. This suite only checks radii.
  configure({disableAutoSnapshot: true})

  it('rounds the outer corners and keeps the shared edge square', async () => {
    void render(
      <TestWrapper schemaTypes={[]}>
        <GlobalPerspectiveButton
          data-testid="pill-trigger"
          handleClearPerspective={() => undefined}
          icon={<RhombusIcon className={suggestIconColor} />}
          text="All users"
        />
      </TestWrapper>,
    )

    const trigger = page.getByTestId('pill-trigger')
    await expect.element(trigger).toBeVisible()
    const button = trigger.element()
    const clear = page.getByTestId('global-perspective-button-clear').element()
    const height = button.getBoundingClientRect().height

    expect(radiusOf(button, 'borderTopLeftRadius')).toBeGreaterThanOrEqual(height / 2)
    expect(radiusOf(button, 'borderTopRightRadius')).toBe(0)
    expect(radiusOf(clear, 'borderTopRightRadius')).toBeGreaterThanOrEqual(height / 2)
    expect(radiusOf(clear, 'borderTopLeftRadius')).toBe(0)
  })
})

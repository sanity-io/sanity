import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {pathToAnchorIdent} from '../../../utils/pathToAnchorIdent'
import {WithEnabledDivergences} from '../../__tests__/enabledDivergences'
import {FormField} from '../FormField'

// The value is far taller than the title row, so a mark that lines up with the value instead of the
// title is tens of pixels off.
const VALUE_HEIGHT = 160

function Harness({
  changedFromBaseVariant,
  divergent = false,
}: {
  changedFromBaseVariant: boolean
  divergent?: boolean
}) {
  const field = (
    <div style={{padding: 48, width: 480}}>
      <FormField
        path={['title']}
        title="Title"
        inputId="title"
        changedFromBaseVariant={changedFromBaseVariant}
      >
        <textarea
          id="title"
          data-testid="value"
          style={{
            anchorName: pathToAnchorIdent('input', ['title']),
            height: VALUE_HEIGHT,
            width: '100%',
          }}
        />
      </FormField>
    </div>
  )
  return (
    <TestWrapper schemaTypes={[]}>
      {divergent ? <WithEnabledDivergences>{field}</WithEnabledDivergences> : field}
    </TestWrapper>
  )
}

function centreY(element: Element): number {
  const {top, height} = element.getBoundingClientRect()
  return top + height / 2
}

function titleCentre(): number {
  return centreY(page.getByText('Title', {exact: true}).element())
}

function valueCentre(): number {
  return centreY(page.getByTestId('value').element())
}

/** The centre of every frame the mark is on screen for, until it leaves the DOM. */
async function sampleMarkUntilGone(): Promise<number[]> {
  const samples: number[] = []
  const deadline = performance.now() + 3000
  while (performance.now() < deadline) {
    const mark = document.querySelector('[data-testid="base-variant-diff-mark"]')
    if (!mark) return samples
    samples.push(centreY(mark))
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }
  throw new Error('The mark never left the DOM')
}

describe('FormField base variant mark', () => {
  it('lines up with the title row, not the value', async () => {
    await render(<Harness changedFromBaseVariant />)

    const mark = page.getByTestId('base-variant-diff-mark')
    await expect.element(mark).toBeVisible()
    expect(Math.abs(valueCentre() - titleCentre())).toBeGreaterThan(40)
    expect(Math.abs(centreY(mark.element()) - titleCentre())).toBeLessThanOrEqual(2)
  })

  // 9.4-F1: setting a changed field back to its base value made the fading mark jump from the title
  // row to the middle of the value before it went away.
  it('stays on the title row while it fades out once the field matches its base again', async () => {
    const {rerender} = await render(<Harness changedFromBaseVariant />)

    await expect.element(page.getByTestId('base-variant-diff-mark')).toBeVisible()
    const title = titleCentre()

    await rerender(<Harness changedFromBaseVariant={false} />)
    const samples = await sampleMarkUntilGone()

    // The exit fade lasts several frames; without them the test would not see the transition.
    expect(samples.length).toBeGreaterThan(1)
    for (const sample of samples) {
      expect(Math.abs(sample - title)).toBeLessThanOrEqual(2)
    }
  })

  // A divergence indicator takes precedence in the gutter, and the base variant mark is hidden
  // behind it. It must stay on the value, where it is for a field that only diverges.
  it('leaves a divergence indicator shown in its place on the value', async () => {
    await render(<Harness changedFromBaseVariant divergent />)

    await expect.element(page.getByTestId('value')).toBeVisible()
    const gutter = page.getByTestId('form-field-gutter').element()
    await expect
      .poll(() => gutter.firstElementChild?.hasAttribute('data-gutter-label-anchored'))
      .toBe(false)
    await expect.element(page.getByTestId('base-variant-diff-mark')).not.toBeVisible()
    expect(Math.abs(centreY(gutter) - valueCentre())).toBeLessThanOrEqual(2)
  })
})

import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {IncompatibleItemType} from '../IncompatibleItemType'

function IncompatibleItemTypeHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <div style={{maxWidth: 360}}>
        <IncompatibleItemType
          value={{_type: 'retiredProduct', title: 'Archived fixture product'}}
        />
      </div>
    </TestWrapper>
  )
}

describe('incompatible member item', () => {
  test('opens details for an incompatible array item', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<IncompatibleItemTypeHarness />)

    const prompt = page.getByRole('button', {name: /retiredProduct/})
    await expect.element(prompt).toBeVisible()
    await userEvent.click(prompt)
    await expect.element(page.getByText('Why is this happening?')).toBeVisible()
    await settleChromaticEndState()
  })
})

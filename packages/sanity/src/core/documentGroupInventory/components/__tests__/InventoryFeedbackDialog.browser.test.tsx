import noop from 'lodash-es/noop.js'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type WorkspaceOptions} from '../../../config/types'
import {InventoryFeedbackDialog} from '../InventoryFeedbackDialog'

const VARIANTS_ON: WorkspaceOptions['beta'] = {variants: {enabled: true}}

function InventoryFeedbackDialogHarness({variantsEnabled}: {variantsEnabled: boolean}) {
  return (
    <TestWrapper schemaTypes={[]} betaFeatures={variantsEnabled ? VARIANTS_ON : undefined}>
      <InventoryFeedbackDialog onClose={noop} />
    </TestWrapper>
  )
}

describe('InventoryFeedbackDialog', () => {
  test('asks about versions only with Content Variants off', async () => {
    await render(<InventoryFeedbackDialogHarness variantsEnabled={false} />)

    const dialog = page.getByRole('dialog')
    await expect.element(dialog.getByText('Share feedback with Sanity on versions')).toBeVisible()
    await expect
      .element(
        dialog.getByText('How easy or difficult is it to create and manage document versions?'),
      )
      .toBeVisible()
    expect(dialog.element().textContent).not.toMatch(/variants/i)
  })

  test('asks about versions and variants with Content Variants on', async () => {
    await render(<InventoryFeedbackDialogHarness variantsEnabled />)

    await expect
      .element(
        page.getByRole('dialog').getByText('Share feedback with Sanity on versions and variants'),
      )
      .toBeVisible()
  })
})

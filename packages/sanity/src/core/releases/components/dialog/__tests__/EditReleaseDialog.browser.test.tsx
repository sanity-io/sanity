import noop from 'lodash-es/noop.js'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {activeASAPRelease} from '../../../__fixtures__/release.fixture'
import {EditReleaseDialog} from '../EditReleaseDialog'

/**
 * Chromatic sentinel for the "Edit release" dialog: the labelled title and description fields
 * and the Save button. The dialog reads nothing from the client until Save is clicked, so the
 * fixture release is enough to render it.
 */
function EditReleaseDialogHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <EditReleaseDialog release={activeASAPRelease} onClose={noop} />
    </TestWrapper>
  )
}

describe('EditReleaseDialog', () => {
  it('prefills the title and description and takes edits', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<EditReleaseDialogHarness />)

    const dialog = page.getByRole('dialog')
    await expect.element(dialog).toBeVisible()
    await expect.element(dialog.getByText('Edit release')).toBeVisible()

    const title = dialog.getByTestId('release-form-title')
    const description = dialog.getByTestId('release-form-description')
    await expect.element(title).toHaveValue('active asap Release')
    await expect.element(description).toHaveValue('active Release description')

    await userEvent.fill(title, 'Spring campaign')
    await expect.element(title).toHaveValue('Spring campaign')
    await expect.element(dialog.getByTestId('save-release-details-button')).toBeEnabled()

    await settleChromaticEndState()
  })
})

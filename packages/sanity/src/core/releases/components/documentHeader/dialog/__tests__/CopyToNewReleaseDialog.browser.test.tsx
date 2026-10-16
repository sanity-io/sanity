import noop from 'lodash-es/noop.js'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {SanityDefaultPreview} from '../../../../../preview/components/SanityDefaultPreview'
import {activeASAPRelease} from '../../../../__fixtures__/release.fixture'
import {CopyToNewReleaseDialog} from '../CopyToNewReleaseDialog'

const RELEASE_FORM_STORAGE_KEY = 'studio.release-form.recovery'

// The dialog previews the version being copied, which does not resolve against `TestWrapper`'s
// mock client, so the preview renders a fixed default preview.
vi.mock('../../../../../preview/components/Preview', () => ({
  Preview: () => <SanityDefaultPreview title="Ada Lovelace" subtitle="Author" />,
}))

const SCHEMA_TYPES = [
  {
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [{name: 'name', type: 'string'}],
  },
]

/**
 * Chromatic sentinel for the "Copy version to new release" dialog: the source document preview
 * next to the source release chip, the embedded release form, and the confirm button.
 */
function CopyToNewReleaseDialogHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <CopyToNewReleaseDialog
        documentType="author"
        versionId="versions.rASAP.author-1"
        release={activeASAPRelease}
        title={activeASAPRelease.metadata.title}
        onClose={noop}
        onCreateVersion={noop}
      />
    </TestWrapper>
  )
}

describe('CopyToNewReleaseDialog', () => {
  beforeEach(() => {
    localStorage.removeItem(RELEASE_FORM_STORAGE_KEY)
  })
  afterEach(() => {
    localStorage.removeItem(RELEASE_FORM_STORAGE_KEY)
  })

  it('takes a title for the new release', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<CopyToNewReleaseDialogHarness />)

    const dialog = page.getByRole('dialog')
    await expect.element(dialog).toBeVisible()
    await expect.element(dialog.getByText('Copy version to new release')).toBeVisible()
    await expect.element(dialog.getByText('Ada Lovelace')).toBeVisible()
    await expect.element(dialog.getByText('active asap Release')).toBeVisible()
    await expect.element(dialog.getByText('As soon as possible')).toBeVisible()

    await userEvent.fill(dialog.getByTestId('release-form-title'), 'Spring campaign')
    await expect.element(dialog.getByTestId('release-form-title')).toHaveValue('Spring campaign')
    await expect.element(dialog.getByTestId('confirm-button')).toBeEnabled()

    await settleChromaticEndState()
  })
})

import noop from 'lodash-es/noop.js'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {FeedbackDialog} from '../components/FeedbackDialog'
import {ImageAttachment} from '../components/ImageAttachment'

const SCREENSHOT = new File([new Uint8Array([137, 80, 78, 71])], 'screenshot.png', {
  type: 'image/png',
})

/**
 * The studio feedback dialog with a name and email in scope, so the contact
 * consent block appears once there is something to send. Submission is never
 * triggered, so nothing reaches `sendFeedbackToSentry`.
 */
function FeedbackDialogHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <FeedbackDialog
        dsn="https://key@sentry.example.test/1"
        feedbackVersion="1"
        source="browser-test"
        userName="Ada Lovelace"
        userEmail="ada@example.test"
        onClose={noop}
      />
    </TestWrapper>
  )
}

/**
 * The attachment drop zone in the two states the dialog only reaches through
 * a real drag or an oversized file: highlighted while a file is dragged over
 * it, with the size error underneath.
 */
function ImageAttachmentDropZoneHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <ImageAttachment
        imageFile={null}
        showAttachment
        dragOver
        error="Image must be under 20 MB"
        onFiles={noop}
        onFilesOver={noop}
        onFilesOut={noop}
        onRemove={noop}
        onExpand={noop}
      />
    </TestWrapper>
  )
}

describe('FeedbackDialog', () => {
  test('fills in a sentiment, message and screenshot and opts in to follow-up', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<FeedbackDialogHarness />)

    const dialog = page.getByRole('dialog')
    await expect.element(dialog.getByText('Share feedback with Sanity')).toBeVisible()

    const submit = dialog.getByRole('button', {name: 'Send feedback'})
    await expect.element(submit).toBeDisabled()

    await dialog.getByRole('button', {name: 'Easy'}).click()
    await expect.element(submit).toBeEnabled()

    await dialog
      .getByLabelText('What is working? What could be better?')
      .fill('The new inventory view is a big improvement, but the empty state is confusing.')

    const consent = dialog.getByLabelText('Can we follow up with you about this feedback?')
    await expect.element(consent).not.toBeChecked()
    await expect.element(dialog.getByText('No', {exact: true})).toBeVisible()

    await dialog.getByRole('button', {name: 'Attach an image'}).click()
    await expect.element(dialog.getByText('Drag or paste file here')).toBeVisible()

    await dialog.getByTestId('file-button-input').upload(SCREENSHOT)
    await expect.element(dialog.getByText('screenshot.png')).toBeVisible()
    await expect.element(dialog.getByRole('button', {name: 'Remove'})).toBeVisible()

    await consent.click()
    await expect.element(consent).toBeChecked()
    await expect.element(dialog.getByText('Yes', {exact: true})).toBeVisible()

    await settleChromaticEndState()
    await expect.element(submit).toBeEnabled()
  })

  test('shows the attachment drop zone highlighted with the size error', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ImageAttachmentDropZoneHarness />)

    await expect.element(page.getByText('Drag or paste file here')).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Browse'})).toBeVisible()
    await expect.element(page.getByText('Image must be under 20 MB')).toBeVisible()

    await settleChromaticEndState()
  })
})

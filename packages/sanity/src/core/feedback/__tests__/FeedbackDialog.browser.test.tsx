import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {FeedbackDialog} from '../components/FeedbackDialog'
import {ImageAttachment} from '../components/ImageAttachment'

const SCHEMA_TYPES: [] = []

// A 1x1 transparent PNG; only its `image/*` type and size matter to the dialog.
const PNG_BYTES = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  ),
  (char) => char.charCodeAt(0),
)

function FeedbackDialogHarness({userName}: {userName?: string}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <FeedbackDialog
        onClose={noop}
        dsn="https://key@sentry.example.test/1"
        feedbackVersion="1"
        source="browser-test"
        userName={userName}
      />
    </TestWrapper>
  )
}

/** Every `ImageAttachment` state side by side; the props alone select them. */
function ImageAttachmentStatesHarness() {
  const file = new File([PNG_BYTES], 'screenshot.png', {type: 'image/png'})
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <Card padding={4} style={{maxWidth: 480}}>
        <Text muted size={1} weight="medium">
          collapsed
        </Text>
        <ImageAttachment
          imageFile={null}
          showAttachment={false}
          dragOver={false}
          error={null}
          onFiles={noop}
          onFilesOver={noop}
          onFilesOut={noop}
          onRemove={noop}
          onExpand={noop}
        />
      </Card>
      <Card padding={4} style={{maxWidth: 480}}>
        <Text muted size={1} weight="medium">
          drop zone, file dragged over, size error
        </Text>
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
      </Card>
      <Card padding={4} style={{maxWidth: 480}}>
        <Text muted size={1} weight="medium">
          attached file
        </Text>
        <ImageAttachment
          imageFile={file}
          showAttachment
          dragOver={false}
          error={null}
          onFiles={noop}
          onFilesOver={noop}
          onFilesOut={noop}
          onRemove={noop}
          onExpand={noop}
        />
      </Card>
    </TestWrapper>
  )
}

const messageField = () => page.getByLabelText('What is working? What could be better?')

describe('FeedbackDialog', () => {
  it('renders the empty dialog', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<FeedbackDialogHarness />)

    await expect.element(page.getByText('Share feedback with Sanity')).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Easy'})).toBeVisible()
    await expect.element(messageField()).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Attach an image'})).toBeVisible()
    // No sentiment picked yet, so Submit stays disabled.
    await expect.element(page.getByRole('button', {name: 'Send feedback'})).toBeDisabled()
    await settleChromaticEndState()
  })

  it('reveals the follow-up consent once a sentiment and message are given', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<FeedbackDialogHarness userName="Ada Lovelace" />)

    await userEvent.click(page.getByRole('button', {name: 'Difficult'}))
    await userEvent.fill(messageField(), 'The publish button is hard to find.')

    await expect
      .element(page.getByLabelText('Can we follow up with you about this feedback?'))
      .toBeVisible()
    await expect.element(page.getByText('No', {exact: true})).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Send feedback'})).toBeEnabled()
    await settleChromaticEndState()
  })

  it('expands the attachment drop zone and accepts a pasted image', async () => {
    const {pasteFileOverPortableTextEditor, settleChromaticEndState} = testHelpers()
    void render(<FeedbackDialogHarness />)

    await userEvent.click(page.getByRole('button', {name: 'Attach an image'}))
    await expect.element(page.getByText('Drag or paste file here')).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Browse'})).toBeVisible()

    // The dialog body listens for `paste` and picks the first image item.
    await pasteFileOverPortableTextEditor(
      {buffer: PNG_BYTES.buffer as ArrayBuffer, fileName: 'screenshot.png', fileType: 'image/png'},
      messageField(),
    )

    await expect.element(page.getByText('screenshot.png')).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Remove'})).toBeVisible()
    await expect.element(page.getByText('Drag or paste file here')).not.toBeInTheDocument()
    await settleChromaticEndState()
  })
})

describe('ImageAttachment', () => {
  it('renders the collapsed, drop zone and attached states', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ImageAttachmentStatesHarness />)

    await expect.element(page.getByRole('button', {name: 'Attach an image'})).toBeVisible()
    await expect.element(page.getByText('Drag or paste file here')).toBeVisible()
    await expect.element(page.getByText('Image must be under 20 MB')).toBeVisible()
    await expect.element(page.getByText('screenshot.png')).toBeVisible()
    await settleChromaticEndState()
  })
})

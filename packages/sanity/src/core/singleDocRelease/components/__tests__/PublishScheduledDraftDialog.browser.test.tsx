import {type SanityDocument} from '@sanity/client'
import noop from 'lodash-es/noop.js'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {scheduledRelease} from '../../../releases/__fixtures__/release.fixture'
import {PublishScheduledDraftDialog} from '../PublishScheduledDraftDialog'

const scheduledDraft: SanityDocument = {
  _id: 'versions.rScheduled.article-1',
  _type: 'article',
  _rev: 'scheduled-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  title: 'Spring launch',
}

// The dialog reads the scheduled draft and its preview from the releases store, which does not
// resolve against `TestWrapper`'s mock client, so the hook hands out a fixed document and the
// preview is a fixed default preview.
vi.mock('../../../preview/components/Preview', () => ({
  Preview: () => <SanityDefaultPreview title="Spring launch" subtitle="Article" />,
}))

vi.mock('../../hooks/useScheduledDraftDocument', () => ({
  useScheduledDraftDocument: () => ({
    firstDocument: scheduledDraft,
    firstDocumentPreview: {title: 'Spring launch'},
    firstDocumentValidation: undefined,
    documentsCount: 1,
    loading: false,
    error: null,
    previewLoading: false,
  }),
}))

vi.mock('../../hooks/useScheduleDraftOperations', () => ({
  useScheduleDraftOperations: () => ({publishScheduledDraft: () => Promise.resolve()}),
}))

const SCHEMA_TYPES = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [{name: 'title', type: 'string'}],
  },
]

/**
 * Chromatic sentinel for the "publish scheduled draft now" confirmation: the document preview,
 * the muted body copy and the primary confirm button.
 */
function PublishScheduledDraftDialogHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <PublishScheduledDraftDialog
        documentType="article"
        release={scheduledRelease}
        onClose={noop}
      />
    </TestWrapper>
  )
}

describe('PublishScheduledDraftDialog', () => {
  it('asks to publish the scheduled draft immediately', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<PublishScheduledDraftDialogHarness />)

    const dialog = page.getByRole('dialog')
    await expect.element(dialog).toBeVisible()
    await expect.element(dialog.getByText('Spring launch')).toBeVisible()
    await expect
      .element(
        dialog.getByText('Are you sure you want to publish this scheduled draft immediately?'),
      )
      .toBeVisible()
    await expect.element(dialog.getByRole('button', {name: 'Yes, run now'})).toBeEnabled()

    await settleChromaticEndState()
  })
})

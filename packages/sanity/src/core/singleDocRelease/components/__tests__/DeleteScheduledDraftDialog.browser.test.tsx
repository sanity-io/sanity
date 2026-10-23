import {type SanityDocument} from '@sanity/client'
import noop from 'lodash-es/noop.js'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import type * as UseObserveDocumentMod from '../../../preview/useObserveDocument'
import {scheduledRelease} from '../../../releases/__fixtures__/release.fixture'
import {DeleteScheduledDraftDialog} from '../DeleteScheduledDraftDialog'

const DRAFT_ID = 'drafts.article-1'
const VERSION_ID = 'versions.rScheduled.article-1'

const scheduledDraft: SanityDocument = {
  _id: VERSION_ID,
  _type: 'article',
  _rev: 'scheduled-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  title: 'Spring launch',
}

const draftWithOwnEdits: SanityDocument = {
  ...scheduledDraft,
  _id: DRAFT_ID,
  _rev: 'draft-rev',
  title: 'Spring launch (edited)',
}

const {scheduledDraftInRelease} = vi.hoisted(() => ({
  scheduledDraftInRelease: {current: true},
}))

// The dialog reads the scheduled draft, its preview and the current draft from the releases and
// document stores. None of that resolves against `TestWrapper`'s mock client, so the hooks hand
// out fixed documents and the preview is a fixed default preview.
vi.mock('../../../preview/components/Preview', () => ({
  Preview: () => <SanityDefaultPreview title="Spring launch" subtitle="Article" />,
}))

vi.mock('../../hooks/useScheduledDraftDocument', () => ({
  useScheduledDraftDocument: () => ({
    firstDocument: scheduledDraftInRelease.current ? scheduledDraft : undefined,
    firstDocumentPreview: scheduledDraftInRelease.current ? {title: 'Spring launch'} : undefined,
    firstDocumentValidation: undefined,
    documentsCount: scheduledDraftInRelease.current ? 1 : 0,
    loading: false,
    error: null,
    previewLoading: false,
  }),
}))

vi.mock('../../hooks/useScheduleDraftOperations', () => ({
  useScheduleDraftOperations: () => ({deleteScheduledDraft: () => Promise.resolve()}),
}))

vi.mock('../../../preview/useObserveDocument', async (importOriginal) => ({
  ...(await importOriginal<typeof UseObserveDocumentMod>()),
  useUnstableObserveDocument: (documentId: string) => ({
    document: {[VERSION_ID]: scheduledDraft, [DRAFT_ID]: draftWithOwnEdits}[documentId] ?? null,
    loading: false,
    error: null,
  }),
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
 * Chromatic sentinel for the delete scheduled draft confirmation: the document preview, the
 * muted body and explanation copy, the copy-to-draft checkbox and the critical confirm button.
 */
function DeleteScheduledDraftDialogHarness({documentId}: {documentId?: string}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <DeleteScheduledDraftDialog
        documentId={documentId}
        documentType={documentId ? 'article' : undefined}
        release={scheduledRelease}
        onClose={noop}
      />
    </TestWrapper>
  )
}

describe('DeleteScheduledDraftDialog', () => {
  beforeEach(() => {
    scheduledDraftInRelease.current = true
  })

  it('offers to copy the scheduled changes when the draft has different changes', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<DeleteScheduledDraftDialogHarness documentId="article-1" />)

    const dialog = page.getByRole('dialog')
    await expect.element(dialog).toBeVisible()
    await expect.element(dialog.getByText('Spring launch')).toBeVisible()
    await expect
      .element(dialog.getByText('Delete this scheduled draft?', {exact: true}))
      .toBeVisible()
    await expect
      .element(
        dialog.getByText('Your scheduled draft has different changes than your current draft.'),
      )
      .toBeVisible()
    await expect.element(dialog.getByRole('checkbox')).toBeChecked()
    await expect.element(dialog.getByRole('button', {name: 'Yes, delete schedule'})).toBeEnabled()

    await settleChromaticEndState()
  })

  it('confirms without a choice when the release holds no document', async () => {
    const {settleChromaticEndState} = testHelpers()
    scheduledDraftInRelease.current = false
    void render(<DeleteScheduledDraftDialogHarness />)

    const dialog = page.getByRole('dialog')
    await expect.element(dialog).toBeVisible()
    await expect
      .element(dialog.getByText('Delete this scheduled draft? Your draft is already up to date.'))
      .toBeVisible()
    await expect.element(dialog.getByRole('button', {name: 'Yes, delete schedule'})).toBeEnabled()

    await settleChromaticEndState()
  })
})

import {type SanityDocument} from '@sanity/client'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {canvasUsEnglishLocaleBundle} from '../../../i18n'
import {UnlinkFromCanvasDialog} from '../UnlinkFromCanvasDialog'

const NOOP = () => undefined

const DRAFT: SanityDocument = {
  _id: 'drafts.story-canvas-doc',
  _type: 'author',
  _rev: 'rev1',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
}

export type UnlinkFromCanvasDialogStoryStatus = 'idle' | 'loading' | 'error'

/**
 * Chromatic sentinel for the unlink-from-Canvas confirm dialog after the ui5
 * VStack/Box migration: muted body copy with the document title, the confirm
 * footer in its idle and loading states, and the critical error card. The
 * schema is empty so the title falls back to "Untitled" without a preview
 * subscription.
 */
export function UnlinkFromCanvasDialogStory(props: {status: UnlinkFromCanvasDialogStoryStatus}) {
  const {status} = props
  return (
    <TestWrapper schemaTypes={[]} i18nBundles={[canvasUsEnglishLocaleBundle]}>
      <UnlinkFromCanvasDialog
        document={DRAFT}
        status={status}
        error={status === 'error' ? 'Failed to unlink from Canvas' : null}
        onClose={NOOP}
        handleUnlink={NOOP}
      />
    </TestWrapper>
  )
}

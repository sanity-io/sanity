import {type SanityDocument} from '@sanity/client'
import {AppIdCacheContext} from 'sanity/_singletons'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type AppIdCache} from '../../../store/studio-app/appIdCache'
import {canvasUsEnglishLocaleBundle} from '../../i18n'
import {LinkToCanvasDialog} from '../LinkToCanvas/LinkToCanvasDialog'
import {UnlinkFromCanvasDialog} from '../UnlinkFromCanvas/UnlinkFromCanvasDialog'

const NOOP = () => undefined

const SCHEMA_TYPES = [
  {
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [{name: 'name', title: 'Name', type: 'string'}],
  },
]

const DOCUMENT: SanityDocument = {
  _id: 'drafts.story-canvas-doc',
  _type: 'author',
  _rev: 'rev1',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  name: 'Ursula K. Le Guin',
}

/**
 * `useLinkToCanvas` resolves the studio app id through the `AppIdCache`
 * context before it does anything else, so a canned cache selects the dialog
 * state without a request: no app id is the "Studio app not found" error, an
 * app id with no document is the missing-document-id error.
 */
const APP_FOUND_CACHE: AppIdCache = {
  get: () => Promise.resolve({appId: 'story-app-id', studioApps: []}),
}
const APP_NOT_FOUND_CACHE: AppIdCache = {
  get: () => Promise.resolve(undefined),
}

export type CanvasDialogsStoryMode =
  | 'unlink-idle'
  | 'unlink-error'
  | 'link-missing-document-id'
  | 'link-app-not-found'

/**
 * Chromatic sentinel for the canvas link and unlink dialogs after the ui5
 * Box/VStack and Text migration: the body copy with the strong document title,
 * the default-tone confirm row, and the critical error cards that fade in via
 * motion. The Storybook `play` waits for those fades. Fixture copy only; the
 * loading states (button spinner, `LoadingBlock`) are skipped as they animate.
 */
function renderDialog(mode: CanvasDialogsStoryMode) {
  switch (mode) {
    case 'unlink-idle':
      return (
        <UnlinkFromCanvasDialog
          document={DOCUMENT}
          error={null}
          handleUnlink={NOOP}
          onClose={NOOP}
          status="idle"
        />
      )
    case 'unlink-error':
      return (
        <UnlinkFromCanvasDialog
          document={DOCUMENT}
          error={null}
          handleUnlink={NOOP}
          onClose={NOOP}
          status="error"
        />
      )
    case 'link-missing-document-id':
      return (
        <AppIdCacheContext.Provider value={APP_FOUND_CACHE}>
          <LinkToCanvasDialog document={undefined} onClose={NOOP} />
        </AppIdCacheContext.Provider>
      )
    case 'link-app-not-found':
      return (
        <AppIdCacheContext.Provider value={APP_NOT_FOUND_CACHE}>
          <LinkToCanvasDialog document={DOCUMENT} onClose={NOOP} />
        </AppIdCacheContext.Provider>
      )
    default: {
      const exhaustive: never = mode
      return exhaustive
    }
  }
}

export function CanvasDialogsStory({mode}: {mode: CanvasDialogsStoryMode}) {
  return (
    <TestWrapper i18nBundles={[canvasUsEnglishLocaleBundle]} schemaTypes={SCHEMA_TYPES}>
      {renderDialog(mode)}
    </TestWrapper>
  )
}

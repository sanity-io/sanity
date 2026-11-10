import noop from 'lodash-es/noop.js'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import type * as UseValuePreviewMod from '../../../../preview/useValuePreview'
import {activeASAPRelease, activeScheduledRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {UnpublishVersionDialog} from '../UnpublishVersionDialog'

// The dialog previews the version, checks out its document pair and looks the release up in the
// releases stores. None of that resolves against `TestWrapper`'s mock client, so the preview is a
// fixed default preview, the pair hooks report an idle, enabled operation, and the stores hand
// out the fixture releases.
vi.mock('../../../../preview/components/Preview', () => ({
  Preview: () => <SanityDefaultPreview title="Ada Lovelace" subtitle="Author" />,
}))

vi.mock('../../../../preview/useValuePreview', async (importOriginal) => ({
  ...(await importOriginal<typeof UseValuePreviewMod>()),
  useValuePreview: () => ({value: {title: 'Ada Lovelace'}}),
}))

vi.mock('../../../../hooks/useDocumentOperation', () => ({
  useDocumentOperation: () => ({unpublish: {disabled: false, execute: noop}}),
}))

vi.mock('../../../../hooks/useDocumentOperationEvent', () => ({
  useDocumentOperationEvent: () => undefined,
}))

vi.mock('../../../store/useActiveReleases', () => ({
  useActiveReleases: () => ({data: [activeASAPRelease, activeScheduledRelease], loading: false}),
}))

vi.mock('../../../store/useArchivedReleases', () => ({
  useArchivedReleases: () => ({data: [], loading: false}),
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
 * Chromatic sentinel for the "unpublish when releasing" confirmation: the document preview, the
 * description with the release title in a tone-coloured label, and the critical confirm button.
 */
function UnpublishVersionDialogHarness({documentVersionId}: {documentVersionId: string}) {
  return (
    <TestWrapper i18nBundles={[releasesUsEnglishLocaleBundle]} schemaTypes={SCHEMA_TYPES}>
      <UnpublishVersionDialog
        documentType="author"
        documentVersionId={documentVersionId}
        onClose={noop}
      />
    </TestWrapper>
  )
}

describe('UnpublishVersionDialog', () => {
  it('names the as-soon-as-possible release the document is unpublished with', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<UnpublishVersionDialogHarness documentVersionId="versions.rASAP.author-1" />)

    const dialog = page.getByRole('dialog')
    await expect.element(dialog).toBeVisible()
    await expect
      .element(dialog.getByText('Are you sure you want to unpublish this document when releasing?'))
      .toBeVisible()
    await expect.element(dialog.getByText('Ada Lovelace')).toBeVisible()
    await expect.element(dialog.getByText('active asap Release', {exact: true})).toBeVisible()
    await expect
      .element(dialog.getByRole('button', {name: 'Yes, unpublish when releasing'}))
      .toBeEnabled()

    await settleChromaticEndState()
  })

  it('names a scheduled release the document is unpublished with', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<UnpublishVersionDialogHarness documentVersionId="versions.rActive.author-1" />)

    const dialog = page.getByRole('dialog')
    await expect.element(dialog).toBeVisible()
    await expect.element(dialog.getByText('active Release', {exact: true})).toBeVisible()
    await expect
      .element(dialog.getByRole('button', {name: 'Yes, unpublish when releasing'}))
      .toBeEnabled()

    await settleChromaticEndState()
  })
})

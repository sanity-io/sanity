import noop from 'lodash-es/noop.js'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import type * as UseTargetDocumentStateMod from '../../../../hooks/useTargetDocumentState'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {activeASAPRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {DiscardVersionDialog} from '../DiscardVersionDialog'

// The dialog previews the document being discarded and checks out its document pair. Neither
// resolves against `TestWrapper`'s mock client, so the preview renders a fixed default preview
// and the pair hooks report an idle, enabled operation.
vi.mock('../../../../preview/components/Preview', () => ({
  Preview: () => <SanityDefaultPreview title="Ada Lovelace" subtitle="Author" />,
}))

vi.mock('../../../../hooks/useDocumentOperation', () => ({
  useDocumentOperation: () => ({discardChanges: {disabled: false, execute: noop}}),
}))

vi.mock('../../../../hooks/useDocumentOperationEvent', () => ({
  useDocumentOperationEvent: () => undefined,
}))

vi.mock('../../../../hooks/useTargetDocumentState', async (importOriginal) => ({
  ...(await importOriginal<typeof UseTargetDocumentStateMod>()),
  useTargetDocumentState: () => ({
    status: 'ready',
    targetDocument: undefined,
    scopeId: undefined,
    variant: undefined,
    siblings: {published: undefined, draft: undefined, version: undefined},
  }),
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
 * Chromatic sentinel for the discard dialog in both of its wordings: removing a version from a
 * release, and discarding a draft.
 */
function DiscardVersionDialogHarness({
  versionId,
  fromPerspective,
}: {
  versionId: string
  fromPerspective: 'drafts' | typeof activeASAPRelease
}) {
  return (
    <TestWrapper i18nBundles={[releasesUsEnglishLocaleBundle]} schemaTypes={SCHEMA_TYPES}>
      <DiscardVersionDialog
        documentType="author"
        versionId={versionId}
        fromPerspective={fromPerspective}
        isGoingToUnpublish={false}
        onClose={noop}
      />
    </TestWrapper>
  )
}

describe('DiscardVersionDialog', () => {
  it('asks to remove a version from its release', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <DiscardVersionDialogHarness
        versionId="versions.rASAP.author-1"
        fromPerspective={activeASAPRelease}
      />,
    )

    // The header is the dialog's accessible name; its text is split around a <strong>.
    const dialog = page.getByRole('dialog', {
      name: "Remove document from the 'active asap Release' release?",
    })
    await expect.element(dialog).toBeVisible()
    await expect.element(dialog.getByText('Ada Lovelace')).toBeVisible()
    await expect.element(dialog.getByRole('button', {name: 'Remove from release'})).toBeEnabled()

    await settleChromaticEndState()
  })

  it('asks to discard a draft', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <DiscardVersionDialogHarness versionId="drafts.author-1" fromPerspective="drafts" />,
    )

    const dialog = page.getByRole('dialog', {name: 'Discard draft?'})
    await expect.element(dialog).toBeVisible()
    await expect.element(dialog.getByText('Ada Lovelace')).toBeVisible()
    await expect.element(dialog.getByRole('button', {name: 'Discard draft'})).toBeEnabled()

    await settleChromaticEndState()
  })
})

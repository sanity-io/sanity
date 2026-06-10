/**
 * Visual-evidence story for the delete-dialog copy change (SAPP-3700).
 *
 * This is not an assertion test — it renders the real dialog and captures a
 * screenshot to `.visual-evidence/`. The `scripts/visual-evidence.mjs` wrapper
 * runs it once on the current branch (after) and once with the source checked
 * out from the base ref (before), then stitches the two into a side-by-side PNG.
 */
import {useDocumentVersions} from 'sanity'
import {beforeAll, describe, expect, it, type Mock, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {ConfirmDeleteDialog} from '../ConfirmDeleteDialog'
import {useReferringDocuments} from '../useReferringDocuments'

vi.mock('sanity', async (importActual) => ({
  ...((await importActual()) as Record<string, unknown>),
  useDocumentVersions: vi.fn(),
}))
vi.mock('../useReferringDocuments', () => ({useReferringDocuments: vi.fn()}))
// Stub the body — it renders a VersionsPreviewList that hits the preview store
// (no real data here). The copy that changed and that we want to capture is the
// footer confirm button ("Delete all versions" -> "Delete document") plus the
// dialog header, both rendered by ConfirmDeleteDialog itself.
vi.mock('../ConfirmDeleteDialogBody', () => ({
  ConfirmDeleteDialogBody: () => null,
}))

const mockUseReferringDocuments = useReferringDocuments as Mock<typeof useReferringDocuments>
const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Wrapper: any

describe('visual-evidence: ConfirmDeleteDialog (single version)', () => {
  beforeAll(async () => {
    mockUseReferringDocuments.mockReturnValue({
      internalReferences: {totalCount: 0, references: []},
      crossDatasetReferences: {totalCount: 0, references: []},
      isLoading: false,
      totalCount: 0,
      projectIds: [],
      datasetNames: [],
      hasUnknownDatasetNames: false,
    } as unknown as ReturnType<typeof useReferringDocuments>)
    // A document with a single version (just a draft) — the case the copy fix targets.
    mockUseDocumentVersions.mockReturnValue({
      data: ['drafts.doc1'],
      loading: false,
    } as unknown as ReturnType<typeof useDocumentVersions>)
    Wrapper = await createTestProvider({
      resources: [structureUsEnglishLocaleBundle],
      config: {
        schema: {
          types: [
            {
              name: 'author',
              type: 'document',
              fields: [{name: 'name', type: 'string'}],
            },
          ],
        },
      },
    })
  })

  it('captures the delete dialog for a single-version document', async () => {
    render(
      <ConfirmDeleteDialog id="doc1" type="author" onCancel={() => {}} onConfirm={() => {}} />,
      {
        wrapper: Wrapper,
      },
    )

    const dialog = page.getByRole('dialog')
    await expect.element(dialog).toBeVisible()
    // Let the dialog's enter animation settle so the capture isn't mid-fade.
    await new Promise((resolve) => setTimeout(resolve, 700))
    await dialog.screenshot({path: '.visual-evidence/delete-dialog.png'})
  })
})

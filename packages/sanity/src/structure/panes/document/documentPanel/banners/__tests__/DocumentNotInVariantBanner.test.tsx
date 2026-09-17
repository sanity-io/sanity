import {type ReleaseDocument} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {
  type SystemVariant,
  useDocumentVersions,
  useGetDefaultPerspective,
  usePerspective,
  useVariantDocumentOperations,
  type VersionInfoDocumentStub,
} from 'sanity'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {useDocumentPane} from '../../../useDocumentPane'
import {DocumentNotInVariantBanner} from '../DocumentNotInVariantBanner'

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('sanity', async () => {
  const sanity = await vi.importActual('sanity')
  return {
    ...sanity,
    usePerspective: vi.fn(),
    useDocumentVersions: vi.fn(),
    useVariantDocumentOperations: vi.fn(),
    useGetDefaultPerspective: vi.fn(),
  }
})

const mockUseDocumentPane = useDocumentPane as Mock<typeof useDocumentPane>
const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>
const mockUseVariantDocumentOperations = useVariantDocumentOperations as Mock<
  typeof useVariantDocumentOperations
>
const mockUseGetDefaultPerspective = useGetDefaultPerspective as Mock<
  typeof useGetDefaultPerspective
>

const createVariantDocument = vi.fn()

const DOCUMENT_ID = 'article-1'
const VARIANT_TITLE = 'Alpha audience'

const variantAlphaAudience: SystemVariant = {
  _id: '_.variants.alpha-audience',
  _type: 'system.variant',
  _createdAt: '2025-01-03T00:00:00Z',
  _updatedAt: '2025-01-03T00:00:00Z',
  _rev: 'rev-alpha-audience',
  conditions: {audience: 'alpha', locale: 'en-US'},
  priority: 2,
  metadata: {
    title: VARIANT_TITLE,
    description: [],
  },
}

const existingDocumentValue = {
  _id: `drafts.${DOCUMENT_ID}`,
  _type: 'article',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-02T00:00:00Z',
  _rev: 'doc-rev-1',
  title: 'Existing article',
}

const newDocumentValue = {
  _id: `drafts.${DOCUMENT_ID}`,
  _type: 'article',
  title: 'New article',
}

// @ts-expect-error -- partial release fixture for perspective title tests
const titledRelease: ReleaseDocument = {
  _id: '_.releases.rSummer',
  _type: 'system.release',
  _rev: 'release-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  state: 'active',
  metadata: {
    title: 'Summer release',
    releaseType: 'asap',
  },
}

// @ts-expect-error -- partial release fixture for perspective title tests
const untitledRelease: ReleaseDocument = {
  _id: '_.releases.rUntitled',
  _type: 'system.release',
  _rev: 'release-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  state: 'active',
  metadata: {
    title: '',
    releaseType: 'asap',
  },
}

const versionStub = (
  stub: Pick<VersionInfoDocumentStub, '_id' | '_rev' | '_system'>,
): VersionInfoDocumentStub => ({
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  _type: 'article',
  ...stub,
})

async function expectBannerMessage({
  perspectiveTitle,
  variantTitle = VARIANT_TITLE,
}: {
  perspectiveTitle: string
  variantTitle?: string
}) {
  const expected = `No ${perspectiveTitle} variant document exists for ${variantTitle}.`

  await waitFor(() => {
    expect(
      screen.getByText((_, element) => {
        if (element?.textContent !== expected) {
          return false
        }

        // Avoid matching ancestors that share the same concatenated textContent.
        return !Array.from(element.children).some((child) => child.textContent === expected)
      }),
    ).toBeInTheDocument()
  })
}

async function renderBanner() {
  const wrapper = await createTestProvider({
    resources: [structureUsEnglishLocaleBundle],
  })

  return render(<DocumentNotInVariantBanner />, {wrapper})
}

describe('DocumentNotInVariantBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseGetDefaultPerspective.mockReturnValue('drafts')
    mockUseDocumentVersions.mockReturnValue({
      data: [],
      versions: [],
      error: null,
      loading: false,
    })
    mockUseVariantDocumentOperations.mockReturnValue({
      createVariantDocument,
    })
    createVariantDocument.mockResolvedValue({transactionId: 'tx-1'})

    mockUseDocumentPane.mockReturnValue({
      documentId: DOCUMENT_ID,
      value: existingDocumentValue,
    } as unknown as ReturnType<typeof useDocumentPane>)

    mockUsePerspective.mockReturnValue({
      selectedPerspective: 'drafts',
      selectedPerspectiveName: undefined,
      selectedReleaseId: undefined,
      perspectiveStack: ['drafts'],
      excludedPerspectives: [],
      selectedVariantName: 'alpha-audience',
      selectedVariant: variantAlphaAudience,
      bundle: 'drafts',
    })
  })

  describe('perspective title', () => {
    it('shows Drafts as the perspective title when drafts is selected', async () => {
      await renderBanner()

      await expectBannerMessage({perspectiveTitle: 'Drafts'})
    })

    it('shows Published as the perspective title when published is selected', async () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspective: 'published',
        selectedPerspectiveName: 'published',
        selectedReleaseId: undefined,
        perspectiveStack: ['published'],
        excludedPerspectives: [],
        selectedVariantName: 'alpha-audience',
        selectedVariant: variantAlphaAudience,
        bundle: 'published',
      })

      await renderBanner()

      await expectBannerMessage({perspectiveTitle: 'Published'})
    })

    it('shows the release metadata title when a release perspective is selected', async () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspective: titledRelease,
        selectedPerspectiveName: 'rSummer',
        selectedReleaseId: 'rSummer',
        perspectiveStack: ['rSummer', 'drafts'],
        excludedPerspectives: [],
        selectedVariantName: 'alpha-audience',
        selectedVariant: variantAlphaAudience,
        bundle: 'rSummer',
      })

      await renderBanner()

      await expectBannerMessage({perspectiveTitle: 'Summer release'})
    })

    it('shows Untitled release when the release has no title', async () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspective: untitledRelease,
        selectedPerspectiveName: 'rUntitled',
        selectedReleaseId: 'rUntitled',
        perspectiveStack: ['rUntitled', 'drafts'],
        excludedPerspectives: [],
        selectedVariantName: 'alpha-audience',
        selectedVariant: variantAlphaAudience,
        bundle: 'rUntitled',
      })

      await renderBanner()

      await expectBannerMessage({perspectiveTitle: 'Untitled release'})
    })

    it('falls back to String(selectedPerspective) for anonymous/string perspectives', async () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspective: 'rAnonymous',
        selectedPerspectiveName: 'rAnonymous',
        selectedReleaseId: 'rAnonymous',
        perspectiveStack: ['rAnonymous', 'drafts'],
        excludedPerspectives: [],
        selectedVariantName: 'alpha-audience',
        selectedVariant: variantAlphaAudience,
        bundle: 'rAnonymous',
      })

      await renderBanner()

      await expectBannerMessage({perspectiveTitle: 'rAnonymous'})
    })

    it('uses the variant id as the variant title when metadata title is missing', async () => {
      const untitledVariant = {
        ...variantAlphaAudience,
        metadata: undefined,
      }

      mockUsePerspective.mockReturnValue({
        selectedPerspective: 'drafts',
        selectedPerspectiveName: undefined,
        selectedReleaseId: undefined,
        perspectiveStack: ['drafts'],
        excludedPerspectives: [],
        selectedVariantName: 'alpha-audience',
        selectedVariant: untitledVariant,
        bundle: 'drafts',
      })

      await renderBanner()

      await expectBannerMessage({
        perspectiveTitle: 'Drafts',
        variantTitle: 'alpha-audience',
      })
    })
  })

  describe('create variant action', () => {
    it('shows the Create variant action when the selected perspective is the default', async () => {
      await renderBanner()

      await waitFor(() => {
        expect(screen.getByRole('button', {name: 'Create variant'})).toBeInTheDocument()
      })
    })

    it('shows the Create variant action when a release is selected', async () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspective: titledRelease,
        selectedPerspectiveName: 'rSummer',
        selectedReleaseId: 'rSummer',
        perspectiveStack: ['rSummer', 'drafts'],
        excludedPerspectives: [],
        selectedVariantName: 'alpha-audience',
        selectedVariant: variantAlphaAudience,
        bundle: 'rSummer',
      })

      await renderBanner()

      await waitFor(() => {
        expect(screen.getByRole('button', {name: 'Create variant'})).toBeInTheDocument()
      })
    })

    it('hides the Create variant action when published is selected and drafts is the default', async () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspective: 'published',
        selectedPerspectiveName: 'published',
        selectedReleaseId: undefined,
        perspectiveStack: ['published'],
        excludedPerspectives: [],
        selectedVariantName: 'alpha-audience',
        selectedVariant: variantAlphaAudience,
        bundle: 'published',
      })

      await renderBanner()

      await expectBannerMessage({perspectiveTitle: 'Published'})
      expect(screen.queryByRole('button', {name: 'Create variant'})).not.toBeInTheDocument()
    })

    it('creates from the document value when the document does not exist yet', async () => {
      mockUseDocumentPane.mockReturnValue({
        documentId: DOCUMENT_ID,
        value: newDocumentValue,
      } as unknown as ReturnType<typeof useDocumentPane>)

      await renderBanner()

      await waitFor(() => {
        expect(screen.getByRole('button', {name: 'Create variant'})).toBeInTheDocument()
      })
      await userEvent.click(screen.getByRole('button', {name: 'Create variant'}))

      await waitFor(() => {
        expect(createVariantDocument).toHaveBeenCalledWith({
          document: {_type: 'article', title: 'New article'},
          documentGroupId: DOCUMENT_ID,
          variant: variantAlphaAudience,
          selectedPerspective: 'drafts',
        })
      })
    })

    it('creates from the pane document as base when the document exists', async () => {
      await renderBanner()

      await waitFor(() => {
        expect(screen.getByRole('button', {name: 'Create variant'})).toBeInTheDocument()
      })
      await userEvent.click(screen.getByRole('button', {name: 'Create variant'}))

      await waitFor(() => {
        expect(createVariantDocument).toHaveBeenCalledWith({
          baseId: existingDocumentValue._id,
          ifBaseRevisionId: existingDocumentValue._rev,
          documentGroupId: DOCUMENT_ID,
          variant: variantAlphaAudience,
          selectedPerspective: 'drafts',
        })
      })
    })

    it('creates live-edit drafts as published variants', async () => {
      mockUseDocumentPane.mockReturnValue({
        documentId: DOCUMENT_ID,
        value: existingDocumentValue,
        schemaType: {liveEdit: true},
      } as unknown as ReturnType<typeof useDocumentPane>)

      await renderBanner()

      await waitFor(() => {
        expect(screen.getByRole('button', {name: 'Create variant'})).toBeInTheDocument()
      })
      await userEvent.click(screen.getByRole('button', {name: 'Create variant'}))

      await waitFor(() => {
        expect(createVariantDocument).toHaveBeenCalledWith({
          baseId: existingDocumentValue._id,
          ifBaseRevisionId: existingDocumentValue._rev,
          documentGroupId: DOCUMENT_ID,
          variant: variantAlphaAudience,
          selectedPerspective: 'published',
        })
      })
    })

    it('prefers a drafts variant sibling as the create base when one exists', async () => {
      const siblingDraft = versionStub({
        _id: 'versions.alpha-scope.article-1',
        _rev: 'sibling-draft-rev',
        _system: {
          bundleId: 'drafts',
          variant: {_ref: variantAlphaAudience._id, _weak: true},
          group: {_ref: DOCUMENT_ID, _weak: true},
          scopeId: 'alpha-scope',
        },
      })

      mockUseDocumentVersions.mockReturnValue({
        data: [siblingDraft._id],
        versions: [siblingDraft],
        error: null,
        loading: false,
      })

      await renderBanner()

      await waitFor(() => {
        expect(screen.getByRole('button', {name: 'Create variant'})).toBeInTheDocument()
      })
      await userEvent.click(screen.getByRole('button', {name: 'Create variant'}))

      await waitFor(() => {
        expect(createVariantDocument).toHaveBeenCalledWith({
          baseId: siblingDraft._id,
          ifBaseRevisionId: siblingDraft._rev,
          documentGroupId: DOCUMENT_ID,
          variant: variantAlphaAudience,
          selectedPerspective: 'drafts',
        })
      })
    })

    it('passes the release perspective through when creating under a release', async () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspective: titledRelease,
        selectedPerspectiveName: 'rSummer',
        selectedReleaseId: 'rSummer',
        perspectiveStack: ['rSummer', 'drafts'],
        excludedPerspectives: [],
        selectedVariantName: 'alpha-audience',
        selectedVariant: variantAlphaAudience,
        bundle: 'rSummer',
      })

      await renderBanner()

      await waitFor(() => {
        expect(screen.getByRole('button', {name: 'Create variant'})).toBeInTheDocument()
      })
      await userEvent.click(screen.getByRole('button', {name: 'Create variant'}))

      await waitFor(() => {
        expect(createVariantDocument).toHaveBeenCalledWith({
          baseId: existingDocumentValue._id,
          ifBaseRevisionId: existingDocumentValue._rev,
          documentGroupId: DOCUMENT_ID,
          variant: variantAlphaAudience,
          selectedPerspective: titledRelease,
        })
      })
    })

    it('keeps the release perspective for live-edit creates under a release', async () => {
      mockUseDocumentPane.mockReturnValue({
        documentId: DOCUMENT_ID,
        value: existingDocumentValue,
        schemaType: {liveEdit: true},
      } as unknown as ReturnType<typeof useDocumentPane>)
      mockUsePerspective.mockReturnValue({
        selectedPerspective: titledRelease,
        selectedPerspectiveName: 'rSummer',
        selectedReleaseId: 'rSummer',
        perspectiveStack: ['rSummer', 'drafts'],
        excludedPerspectives: [],
        selectedVariantName: 'alpha-audience',
        selectedVariant: variantAlphaAudience,
        bundle: 'rSummer',
      })

      await renderBanner()

      await waitFor(() => {
        expect(screen.getByRole('button', {name: 'Create variant'})).toBeInTheDocument()
      })
      await userEvent.click(screen.getByRole('button', {name: 'Create variant'}))

      await waitFor(() => {
        expect(createVariantDocument).toHaveBeenCalledWith({
          baseId: existingDocumentValue._id,
          ifBaseRevisionId: existingDocumentValue._rev,
          documentGroupId: DOCUMENT_ID,
          variant: variantAlphaAudience,
          selectedPerspective: titledRelease,
        })
      })
    })

    it('disables the action after a successful create', async () => {
      await renderBanner()

      await waitFor(() => {
        expect(screen.getByRole('button', {name: 'Create variant'})).toBeInTheDocument()
      })
      const button = screen.getByRole('button', {name: 'Create variant'})
      await userEvent.click(button)

      await waitFor(() => {
        expect(button).toBeDisabled()
      })
    })

    it('shows an error toast and re-enables the action when create fails', async () => {
      createVariantDocument.mockRejectedValueOnce(new Error('create failed'))

      await renderBanner()

      await waitFor(() => {
        expect(screen.getByRole('button', {name: 'Create variant'})).toBeInTheDocument()
      })
      const button = screen.getByRole('button', {name: 'Create variant'})
      await userEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Error adding document to variant')).toBeInTheDocument()
      })
      expect(
        screen.getByText('An error occurred when adding document to the variant: create failed'),
      ).toBeInTheDocument()
      expect(button).not.toBeDisabled()
    })
  })
})

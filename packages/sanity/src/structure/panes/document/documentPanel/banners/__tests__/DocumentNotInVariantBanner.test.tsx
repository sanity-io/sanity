import {type ReleaseDocument} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {
  type SystemVariant,
  useDocumentVersions,
  useGetDefaultPerspective,
  usePerspective,
  useSetPerspective,
  useVariantDocumentOperations,
  type VersionInfoDocumentStub,
} from 'sanity'
import {useRouter} from 'sanity/router'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {useDocumentPane} from '../../../useDocumentPane'
import {
  DocumentNotInVariantBanner,
  type NotInVariantBannerCase,
} from '../DocumentNotInVariantBanner'

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
    useSetPerspective: vi.fn(),
  }
})

vi.mock('sanity/router', async () => {
  const router = await vi.importActual('sanity/router')
  return {...router, useRouter: vi.fn()}
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

const mockUseSetPerspective = useSetPerspective as Mock<typeof useSetPerspective>
const mockUseRouter = useRouter as Mock<typeof useRouter>

const createVariantDocument = vi.fn()
const setPerspective = vi.fn()
const navigateIntent = vi.fn()

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

// @ts-expect-error -- partial release fixture
const scheduledRelease: ReleaseDocument = {
  _id: '_.releases.rScheduled',
  _type: 'system.release',
  _rev: 'release-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  state: 'scheduled',
  metadata: {
    title: 'Spring launch',
    releaseType: 'scheduled',
  },
}

function perspectiveState(
  selectedPerspective: ReturnType<typeof usePerspective>['selectedPerspective'],
  selectedPerspectiveName: string | undefined,
  selectedVariants: SystemVariant[] = [variantAlphaAudience],
): ReturnType<typeof usePerspective> {
  const isRelease =
    typeof selectedPerspectiveName === 'string' && selectedPerspectiveName.startsWith('r')
  return {
    selectedPerspective,
    selectedPerspectiveName,
    selectedReleaseId: isRelease ? selectedPerspectiveName : undefined,
    perspectiveStack: isRelease
      ? [selectedPerspectiveName, 'drafts']
      : [selectedPerspectiveName ?? 'drafts'],
    excludedPerspectives: [],
    selectedVariantNames: ['alpha-audience'],
    selectedVariants,
    // oxlint-disable-next-line typescript/no-deprecated
    selectedVariantName: 'alpha-audience',
    // oxlint-disable-next-line typescript/no-deprecated
    selectedVariant: selectedVariants[0],
    bundle: selectedPerspectiveName ?? 'drafts',
  } as ReturnType<typeof usePerspective>
}

const versionStub = (
  stub: Pick<VersionInfoDocumentStub, '_id' | '_rev' | '_system'>,
): VersionInfoDocumentStub => ({
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  _type: 'article',
  ...stub,
})

async function expectBannerMessage(expected: string) {
  await waitFor(() => {
    expect(screen.getByTestId('document-not-in-variant-banner').textContent).toBe(expected)
  })
}

const CREATE_IN_DRAFTS: NotInVariantBannerCase = {kind: 'create', perspective: 'drafts'}

async function renderBanner(bannerCase: NotInVariantBannerCase = CREATE_IN_DRAFTS) {
  const wrapper = await createTestProvider({
    resources: [structureUsEnglishLocaleBundle],
  })

  return render(<DocumentNotInVariantBanner bannerCase={bannerCase} />, {wrapper})
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
    mockUseSetPerspective.mockReturnValue(setPerspective)
    mockUseRouter.mockReturnValue({navigateIntent} as unknown as ReturnType<typeof useRouter>)

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
      selectedVariantNames: ['alpha-audience'],
      selectedVariants: [variantAlphaAudience],
      // oxlint-disable-next-line typescript/no-deprecated
      selectedVariantName: 'alpha-audience',
      // oxlint-disable-next-line typescript/no-deprecated
      selectedVariant: variantAlphaAudience,
      bundle: 'drafts',
    })
  })

  describe('copy and actions per case', () => {
    it('Drafts: names the variant as a chip and offers Create variant', async () => {
      await renderBanner()

      await expectBannerMessage(
        'This document has no draft for the variant Alpha audience yet. Create one to start editing.',
      )
      expect(screen.getByTestId('variant-banner-variant-chip').textContent).toBe(VARIANT_TITLE)
      expect(screen.getByRole('button', {name: 'Create variant'})).toBeInTheDocument()
    })

    it('uses the variant id as the variant title when metadata title is missing', async () => {
      const untitledVariant = {...variantAlphaAudience, metadata: undefined}
      mockUsePerspective.mockReturnValue(perspectiveState('drafts', undefined, [untitledVariant]))

      await renderBanner()

      await expectBannerMessage(
        'This document has no draft for the variant alpha-audience yet. Create one to start editing.',
      )
    })

    it('open release: names the release and offers Create variant', async () => {
      mockUsePerspective.mockReturnValue(perspectiveState(titledRelease, 'rSummer'))

      await renderBanner({kind: 'create', perspective: 'release'})

      await expectBannerMessage(
        'This document has no version for the variant Alpha audience in the ASAP release Summer release yet. Create one to start editing.',
      )
      expect(screen.getByRole('button', {name: 'Create variant'})).toBeInTheDocument()
    })

    it('open release: falls back to Untitled release', async () => {
      mockUsePerspective.mockReturnValue(perspectiveState(untitledRelease, 'rUntitled'))

      await renderBanner({kind: 'create', perspective: 'release'})

      await expectBannerMessage(
        'This document has no version for the variant Alpha audience in the ASAP release Untitled release yet. Create one to start editing.',
      )
    })

    it('scheduled release: offers Open release, not Create variant', async () => {
      mockUsePerspective.mockReturnValue(perspectiveState(scheduledRelease, 'rScheduled'))

      await renderBanner({kind: 'locked-release'})

      await expectBannerMessage(
        'The scheduled release Spring launch is locked. Unschedule it to add a version for the variant Alpha audience.',
      )
      expect(screen.queryByRole('button', {name: 'Create variant'})).not.toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', {name: 'Open release'}))
      expect(navigateIntent).toHaveBeenCalledWith('release', {id: 'rScheduled'})
    })

    it('Published, variant has a draft: offers Switch to Drafts', async () => {
      mockUsePerspective.mockReturnValue(perspectiveState('published', 'published'))

      await renderBanner({kind: 'switch-to-drafts'})

      await expectBannerMessage(
        'This document has no published version for the variant Alpha audience yet. Its draft is in Drafts.',
      )
      await userEvent.click(screen.getByRole('button', {name: 'Switch to Drafts'}))
      expect(setPerspective).toHaveBeenCalledWith('drafts')
      expect(createVariantDocument).not.toHaveBeenCalled()
    })

    it('Published, variant has no draft: creates the draft, then switches to Drafts', async () => {
      mockUsePerspective.mockReturnValue(perspectiveState('published', 'published'))

      await renderBanner({kind: 'create-in-drafts'})

      await expectBannerMessage(
        'This document has no published version for the variant Alpha audience yet. Create one in Drafts to start editing.',
      )
      await userEvent.click(screen.getByRole('button', {name: 'Create variant'}))

      await waitFor(() => {
        expect(setPerspective).toHaveBeenCalledWith('drafts')
      })
      expect(createVariantDocument).toHaveBeenCalledWith({
        baseId: existingDocumentValue._id,
        ifBaseRevisionId: existingDocumentValue._rev,
        documentGroupId: DOCUMENT_ID,
        variant: variantAlphaAudience,
        selectedPerspective: 'drafts',
      })
    })

    it('Published, create fails: stays in Published', async () => {
      createVariantDocument.mockRejectedValueOnce(new Error('create failed'))
      mockUsePerspective.mockReturnValue(perspectiveState('published', 'published'))

      await renderBanner({kind: 'create-in-drafts'})
      await userEvent.click(await screen.findByRole('button', {name: 'Create variant'}))

      await waitFor(() => {
        expect(screen.getByText('Error adding document to variant')).toBeInTheDocument()
      })
      expect(setPerspective).not.toHaveBeenCalled()
    })

    it('Published without Drafts (live edit): creates the published variant in place', async () => {
      mockUseDocumentPane.mockReturnValue({
        documentId: DOCUMENT_ID,
        value: existingDocumentValue,
        schemaType: {liveEdit: true},
      } as unknown as ReturnType<typeof useDocumentPane>)
      mockUsePerspective.mockReturnValue(perspectiveState('published', 'published'))

      await renderBanner({kind: 'create', perspective: 'published'})

      await expectBannerMessage(
        'This document has no published version for the variant Alpha audience yet. Create one to start editing.',
      )
      await userEvent.click(screen.getByRole('button', {name: 'Create variant'}))

      await waitFor(() => {
        expect(createVariantDocument).toHaveBeenCalledWith(
          expect.objectContaining({selectedPerspective: 'published'}),
        )
      })
      expect(setPerspective).not.toHaveBeenCalled()
    })
  })

  describe('create variant action', () => {
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
          variants: [{_ref: variantAlphaAudience._id, _key: 'k-123'}],
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
        selectedVariantNames: ['alpha-audience'],
        selectedVariants: [variantAlphaAudience],
        // oxlint-disable-next-line typescript/no-deprecated
        selectedVariantName: 'alpha-audience',
        // oxlint-disable-next-line typescript/no-deprecated
        selectedVariant: variantAlphaAudience,
        bundle: 'rSummer',
      })

      await renderBanner({kind: 'create', perspective: 'release'})

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
        selectedVariantNames: ['alpha-audience'],
        selectedVariants: [variantAlphaAudience],
        // oxlint-disable-next-line typescript/no-deprecated
        selectedVariantName: 'alpha-audience',
        // oxlint-disable-next-line typescript/no-deprecated
        selectedVariant: variantAlphaAudience,
        bundle: 'rSummer',
      })

      await renderBanner({kind: 'create', perspective: 'release'})

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

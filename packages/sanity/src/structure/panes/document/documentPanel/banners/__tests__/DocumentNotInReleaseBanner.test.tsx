import {type ReleaseDocument} from '@sanity/client'
import {render, screen} from '@testing-library/react'
import {useVersionOperations} from 'sanity'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {DocumentNotInReleaseBanner} from '../DocumentNotInReleaseBanner'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useVersionOperations: vi.fn(),
}))

const mockUseVersionOperations = useVersionOperations as Mock<typeof useVersionOperations>

const DOCUMENT_ID = 'article-1'

function release(
  releaseType: ReleaseDocument['metadata']['releaseType'],
  overrides: Partial<ReleaseDocument> = {},
): ReleaseDocument {
  return {
    _id: '_.releases.rSpring',
    _type: 'system.release',
    _rev: 'rev-1',
    _createdAt: '2025-01-02T12:00:00Z',
    _updatedAt: '2025-01-03T12:00:00Z',
    name: 'rSpring',
    state: 'active',
    metadata: {title: 'Spring launch', releaseType},
    ...overrides,
  } as ReleaseDocument
}

async function renderBanner({
  currentRelease,
  isScheduledRelease,
  variantsEnabled = true,
}: {
  currentRelease: ReleaseDocument | string
  isScheduledRelease?: boolean
  variantsEnabled?: boolean
}) {
  const wrapper = await createTestProvider({
    resources: [structureUsEnglishLocaleBundle],
    config: variantsEnabled ? {beta: {variants: {enabled: true}}} : undefined,
  })
  return render(
    <DocumentNotInReleaseBanner
      documentId={DOCUMENT_ID}
      currentRelease={currentRelease as ReleaseDocument}
      isScheduledRelease={isScheduledRelease}
    />,
    {wrapper},
  )
}

/** The banner's sentence, with the chip's text inline */
async function sentence() {
  const text = await screen.findByText(
    (_, element) =>
      element?.getAttribute('data-ui') === 'Text' &&
      Boolean(element.textContent?.startsWith("This document isn't in the")),
  )
  return text.textContent?.replace(/\s+/g, ' ').trim()
}

describe('DocumentNotInReleaseBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseVersionOperations.mockReturnValue({
      createVersion: vi.fn(),
    } as unknown as ReturnType<typeof useVersionOperations>)
  })

  it('keeps the earlier copy with Variants off', async () => {
    await renderBanner({currentRelease: release('asap'), variantsEnabled: false})

    expect(await screen.findByRole('button', {name: 'Add to release'})).toBeEnabled()
    expect(screen.getByText(/Not in the/).textContent).toMatch(
      /Not in the\s*Spring launch\s*release\./,
    )
  })

  it.each(['asap', 'undecided', 'scheduled'] as const)(
    'uses one sentence for an open %s release',
    async (releaseType) => {
      await renderBanner({currentRelease: release(releaseType)})

      expect(await sentence()).toBe("This document isn't in the release Spring launch yet.")
      expect(screen.getByRole('button', {name: 'Add to release'})).toBeEnabled()
    },
  )

  it('drops "yet" and the action for a scheduled release, which is locked', async () => {
    await renderBanner({
      currentRelease: release('scheduled', {state: 'scheduled'}),
      isScheduledRelease: true,
    })

    expect(await sentence()).toBe("This document isn't in the release Spring launch.")
    expect(screen.queryByRole('button', {name: 'Add to release'})).not.toBeInTheDocument()
  })

  it('names a release id that has not loaded yet as a release, matching its action', async () => {
    await renderBanner({currentRelease: 'rSpring'})

    expect(await sentence()).toMatch(/^This document isn't in the release rSpring/)
    expect(screen.getByRole('button', {name: 'Add to release'})).toBeInTheDocument()
  })

  it('names an agent bundle as a bundle, matching its action', async () => {
    await renderBanner({currentRelease: 'agent-abc123'})

    expect(await sentence()).toMatch(/^This document isn't in the bundle agent-abc123/)
    expect(screen.getByRole('button', {name: 'Add to bundle'})).toBeInTheDocument()
  })
})

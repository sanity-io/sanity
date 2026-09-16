import {type ReleaseDocument} from '@sanity/client'
import {Menu} from '@sanity/ui/menu'
import {render, screen, within} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {useDocumentVersionTypeSortedList} from '../../../releases/hooks/useDocumentVersionTypeSortedList'
import {DocumentReleaseSections, ReleaseTypeSections} from '../ReleaseMenuSections'

vi.mock('../../../releases/hooks/useDocumentVersionTypeSortedList', () => ({
  useDocumentVersionTypeSortedList: vi.fn(() => ({sortedDocumentList: []})),
}))

const mockUseDocumentVersionTypeSortedList = vi.mocked(useDocumentVersionTypeSortedList)

const allReleases = [activeASAPRelease, activeScheduledRelease, activeUndecidedRelease]

/**
 * Enough scheduled releases to cross `RELEASE_TIME_BUCKET_HEADING_THRESHOLD`, dated so that more
 * than one band is populated — a single band would label itself and prove nothing.
 */
function manyScheduledReleases(count: number): ReleaseDocument[] {
  return Array.from({length: count}, (_unused, index) => ({
    ...activeScheduledRelease,
    _id: `_.releases.bulk${index}`,
    metadata: {
      ...activeScheduledRelease.metadata,
      releaseType: 'scheduled' as const,
      // Two days apart, so the first few land in `thisWeek` and the rest spread beyond it.
      intendedPublishAt: new Date(Date.now() + (index + 1) * 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  }))
}

async function renderSections(node: React.JSX.Element) {
  const wrapper = await createTestProvider()
  const view = render(<Menu>{node}</Menu>, {wrapper})
  // The locale bundle resolves asynchronously; without this the first test in
  // the file asserts against raw i18n keys.
  await flushMicrotasksThisIsACodeSmell()
  return view
}

describe('ReleaseTypeSections', () => {
  it('leaves a short list unlabelled, and still lists every release', async () => {
    await renderSections(<ReleaseTypeSections releases={allReleases} />)

    // A heading over one or two rows interrupts more than it explains, so below the threshold the
    // list is one unlabelled sequence.
    expect(screen.queryByText('As soon as possible')).not.toBeInTheDocument()
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
    expect(screen.queryByText('Undecided')).not.toBeInTheDocument()

    expect(screen.getByText('active asap Release')).toBeInTheDocument()
    expect(screen.getByText('active Release')).toBeInTheDocument()
    expect(screen.getByText('undecided Release')).toBeInTheDocument()
  })

  it('divides a short list by release type, so a rule falls where the icon changes', async () => {
    const {container} = await renderSections(<ReleaseTypeSections releases={allReleases} />)

    // Each section is a bordered card. One per band ruled between single-release bands that named
    // neither side; one for everything lost the only distinction visible on the row, the icon. The
    // three fixtures are one of each type, so each gets a section and there are exactly two rules.
    expect(
      container.querySelectorAll('[data-testid^="release-menu-section-sequence"]'),
    ).toHaveLength(3)
    expect(screen.getByTestId('release-menu-section-sequence-asap')).toBeInTheDocument()
    expect(screen.getByTestId('release-menu-section-sequence-dated')).toBeInTheDocument()
    expect(screen.getByTestId('release-menu-section-sequence-undecided')).toBeInTheDocument()
  })

  it('labels the time bands once the list is long enough to need them', async () => {
    await renderSections(<ReleaseTypeSections releases={manyScheduledReleases(20)} />)

    expect(screen.getByText('This week')).toBeInTheDocument()
    expect(screen.getByText('This month')).toBeInTheDocument()
  })

  it('labels only the bands that hold something', async () => {
    await renderSections(<ReleaseTypeSections releases={manyScheduledReleases(20)} />)

    // Every band is rendered, but an empty one draws nothing — so no heading appears over a gap.
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
    expect(screen.queryByText('Undecided')).not.toBeInTheDocument()
  })
})

describe('DocumentReleaseSections', () => {
  beforeEach(() => {
    mockUseDocumentVersionTypeSortedList.mockReturnValue({sortedDocumentList: []})
  })

  it('falls back to the plain time sequence when the document has no versions', async () => {
    await renderSections(<DocumentReleaseSections documentId="book-1" releases={allReleases} />)

    expect(screen.getByText('active asap Release')).toBeInTheDocument()
    expect(screen.queryByText(/Part of/)).not.toBeInTheDocument()
    expect(screen.queryByText('Other releases')).not.toBeInTheDocument()
  })

  it('lists the releases holding a version under a counted heading', async () => {
    mockUseDocumentVersionTypeSortedList.mockReturnValue({
      sortedDocumentList: [activeASAPRelease, activeScheduledRelease],
    })

    await renderSections(<DocumentReleaseSections documentId="book-1" releases={allReleases} />)

    const partOf = screen.getByTestId('release-menu-section-part-of')
    expect(within(partOf).getByText('Part of 2 releases')).toBeInTheDocument()
    expect(within(partOf).getByText('active asap Release')).toBeInTheDocument()
    expect(within(partOf).getByText('active Release')).toBeInTheDocument()
    expect(within(partOf).queryByText('undecided Release')).not.toBeInTheDocument()
  })

  it('singularises the heading for a single release', async () => {
    mockUseDocumentVersionTypeSortedList.mockReturnValue({
      sortedDocumentList: [activeASAPRelease],
    })

    await renderSections(<DocumentReleaseSections documentId="book-1" releases={allReleases} />)

    expect(screen.getByText('Part of 1 release')).toBeInTheDocument()
  })

  it('puts the remaining releases under a single "Other releases" heading', async () => {
    mockUseDocumentVersionTypeSortedList.mockReturnValue({
      sortedDocumentList: [activeASAPRelease],
    })

    await renderSections(<DocumentReleaseSections documentId="book-1" releases={allReleases} />)

    // Both remaining releases are listed...
    expect(screen.getByText('active Release')).toBeInTheDocument()
    expect(screen.getByText('undecided Release')).toBeInTheDocument()
    // ...under exactly one heading, carried by the first non-empty group. The
    // later groups are separated by their card border alone.
    expect(screen.getAllByText('Other releases')).toHaveLength(1)
    expect(screen.queryByText('At time')).not.toBeInTheDocument()
    expect(screen.queryByText('Undecided')).not.toBeInTheDocument()
  })

  it('ignores a release the caller has filtered out', async () => {
    // The hook is document-scoped and knows nothing about the filter query or
    // the scheduled-draft exclusion, so the section must intersect with what the
    // caller passed in.
    mockUseDocumentVersionTypeSortedList.mockReturnValue({
      sortedDocumentList: [activeASAPRelease, activeUndecidedRelease],
    })

    await renderSections(
      <DocumentReleaseSections documentId="book-1" releases={[activeASAPRelease]} />,
    )

    expect(screen.getByText('Part of 1 release')).toBeInTheDocument()
    expect(screen.queryByText('undecided Release')).not.toBeInTheDocument()
  })
})

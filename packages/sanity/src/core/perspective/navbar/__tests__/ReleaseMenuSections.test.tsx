import {Menu} from '@sanity/ui/menu'
import {render, screen, within} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

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

async function renderSections(node: React.JSX.Element) {
  const wrapper = await createTestProvider()
  return render(<Menu>{node}</Menu>, {wrapper})
}

describe('ReleaseTypeSections', () => {
  it('labels every non-empty release type', async () => {
    await renderSections(<ReleaseTypeSections releases={allReleases} />)

    expect(screen.getByText('As soon as possible')).toBeInTheDocument()
    expect(screen.getByText('At time')).toBeInTheDocument()
    expect(screen.getByText('Undecided')).toBeInTheDocument()
  })

  it('omits a section entirely when its type has no releases', async () => {
    await renderSections(<ReleaseTypeSections releases={[activeASAPRelease]} />)

    expect(screen.getByText('As soon as possible')).toBeInTheDocument()
    expect(screen.queryByText('At time')).not.toBeInTheDocument()
    expect(screen.queryByText('Undecided')).not.toBeInTheDocument()
  })
})

describe('DocumentReleaseSections', () => {
  beforeEach(() => {
    mockUseDocumentVersionTypeSortedList.mockReturnValue({sortedDocumentList: []})
  })

  it('falls back to the type sections when the document has no versions', async () => {
    await renderSections(<DocumentReleaseSections documentId="book-1" releases={allReleases} />)

    expect(screen.getByText('As soon as possible')).toBeInTheDocument()
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

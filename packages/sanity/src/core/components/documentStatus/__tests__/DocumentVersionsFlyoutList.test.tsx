import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {activeASAPRelease} from '../../../releases/__fixtures__/release.fixture'
import {useDocumentVersions} from '../../../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {useAllVariants} from '../../../variants/store/useAllVariants'
import {DocumentVersionsFlyoutList} from '../DocumentVersionsFlyoutList'

vi.mock('../../../releases/hooks/useDocumentVersions', () => ({useDocumentVersions: vi.fn()}))
vi.mock('../../../releases/store/useActiveReleases', () => ({useActiveReleases: vi.fn()}))
vi.mock('../../../variants/store/useAllVariants', () => ({useAllVariants: vi.fn()}))

const GROUP_ID = 'article-1'

function version(id: string, bundleId?: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _type: 'article',
    _rev: `${id}-rev`,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-10-22T11:00:00.000Z',
    _system: {bundleId, group: {_ref: GROUP_ID, _weak: true}},
  }
}

async function renderList(versions: VersionInfoDocumentStub[]) {
  ;(useDocumentVersions as Mock<typeof useDocumentVersions>).mockReturnValue({
    data: versions.map((v) => v._id),
    versions,
    error: null,
    loading: false,
  })
  const wrapper = await createTestProvider()
  render(
    <DocumentVersionsFlyoutList
      documentGroupId={GROUP_ID}
      onOpenInventory={() => {}}
      onPick={() => {}}
    />,
    {wrapper},
  )
}

describe('DocumentVersionsFlyoutList footer', () => {
  beforeEach(() => {
    ;(useActiveReleases as Mock<typeof useActiveReleases>).mockReturnValue({
      data: [activeASAPRelease],
      byId: new Map([[activeASAPRelease._id, activeASAPRelease]]),
      loading: false,
      error: undefined,
    } as ReturnType<typeof useActiveReleases>)
    ;(useAllVariants as Mock<typeof useAllVariants>).mockReturnValue({
      data: [],
      byId: new Map(),
      loading: false,
      error: undefined,
    })
  })

  it('offers Manage versions for a document with only Published and Draft', async () => {
    await renderList([version(GROUP_ID), version(`drafts.${GROUP_ID}`, 'drafts')])
    const footer = await screen.findByTestId('document-versions-flyout-inventory')
    expect(footer.textContent).toBe('Manage versions')
    expect(screen.queryByText('See all versions in the inventory')).toBeNull()
  })

  it('offers Manage versions for a published document alone, as on a live-edit type', async () => {
    await renderList([version(GROUP_ID)])
    const footer = await screen.findByTestId('document-versions-flyout-inventory')
    expect(footer.textContent).toBe('Manage versions')
  })

  it('offers Manage versions for a draft alone', async () => {
    await renderList([version(`drafts.${GROUP_ID}`, 'drafts')])
    const footer = await screen.findByTestId('document-versions-flyout-inventory')
    expect(footer.textContent).toBe('Manage versions')
  })

  it('offers to see all versions, without a count, when the document is in a release', async () => {
    await renderList([
      version(GROUP_ID),
      version(`drafts.${GROUP_ID}`, 'drafts'),
      version(`versions.${activeASAPRelease.name}.${GROUP_ID}`, activeASAPRelease.name),
    ])
    expect(await screen.findByText('See all versions in the inventory')).toBeTruthy()
    expect(screen.queryByText(/\d more/)).toBeNull()
    expect(screen.queryByText('Manage versions')).toBeNull()
  })

  it('shows a loading state, not an empty panel, while the versions load', async () => {
    ;(useDocumentVersions as Mock<typeof useDocumentVersions>).mockReturnValue({
      data: [],
      versions: [],
      error: null,
      loading: true,
    })
    const wrapper = await createTestProvider()
    render(
      <DocumentVersionsFlyoutList
        documentGroupId={GROUP_ID}
        onOpenInventory={() => {}}
        onPick={() => {}}
      />,
      {wrapper},
    )
    expect(await screen.findByTestId('document-versions-flyout-loading')).toBeTruthy()
    expect(screen.getByText(/loading/i)).toBeTruthy()
  })
})

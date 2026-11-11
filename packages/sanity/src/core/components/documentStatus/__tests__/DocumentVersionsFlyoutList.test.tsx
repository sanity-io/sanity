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

  it('offers to manage versions for a single version', async () => {
    await renderList([version(`drafts.${GROUP_ID}`, 'drafts')])
    expect(await screen.findByText('Manage versions in inventory')).toBeTruthy()
  })

  it('counts the versions, resolving the plural, for more than one', async () => {
    await renderList([version(GROUP_ID), version(`drafts.${GROUP_ID}`, 'drafts')])
    expect(await screen.findByText('See all 2 versions in inventory')).toBeTruthy()
  })
})

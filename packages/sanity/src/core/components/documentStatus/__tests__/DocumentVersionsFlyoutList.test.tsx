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

async function renderList(
  versions: VersionInfoDocumentStub[],
  {variantsEnabled = false}: {variantsEnabled?: boolean} = {},
) {
  ;(useDocumentVersions as Mock<typeof useDocumentVersions>).mockReturnValue({
    data: versions.map((v) => v._id),
    versions,
    error: null,
    loading: false,
  })
  const wrapper = await createTestProvider(
    variantsEnabled ? {config: {beta: {variants: {enabled: true}}}} : undefined,
  )
  render(
    <DocumentVersionsFlyoutList
      documentGroupId={GROUP_ID}
      onOpenInventory={() => {}}
      onPick={() => {}}
    />,
    {wrapper},
  )
}

function rowTitle(): string | null {
  return screen.getByTestId('document-versions-flyout-row').textContent
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

  it('offers to manage all versions, without a count, when the document is in a release', async () => {
    await renderList([
      version(GROUP_ID),
      version(`drafts.${GROUP_ID}`, 'drafts'),
      version(`versions.${activeASAPRelease.name}.${GROUP_ID}`, activeASAPRelease.name),
    ])
    expect(await screen.findByText('Manage all versions')).toBeTruthy()
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

describe('DocumentVersionsFlyoutList row name', () => {
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

  it('names the row Published, not Default, with variants off', async () => {
    await renderList([version(GROUP_ID)])
    await screen.findByTestId('document-versions-flyout-row')
    expect(rowTitle()).toMatch(/^Published/)
    expect(screen.queryByText('Default')).toBeNull()
  })

  it('names the row Draft when the draft is the latest edit, with variants off', async () => {
    await renderList([
      {...version(GROUP_ID), _updatedAt: '2026-10-20T11:00:00.000Z'},
      version(`drafts.${GROUP_ID}`, 'drafts'),
    ])
    await screen.findByTestId('document-versions-flyout-row')
    expect(rowTitle()).toMatch(/^Draft/)
    // The line reads the same without variants
    expect(screen.getByTestId('document-versions-flyout-row-lead').textContent).toBe(
      'Unpublished edits',
    )
    expect(screen.queryByText('Default')).toBeNull()
  })

  it('names the row after the release when it has the latest edit, with variants off', async () => {
    const releaseVersion = version(
      `versions.${activeASAPRelease.name}.${GROUP_ID}`,
      activeASAPRelease.name,
    )
    await renderList([
      {...version(GROUP_ID), _updatedAt: '2026-10-20T11:00:00.000Z'},
      {
        ...releaseVersion,
        _system: {...releaseVersion._system, release: {_ref: activeASAPRelease._id, _weak: true}},
      },
    ])
    await screen.findByTestId('document-versions-flyout-row')
    expect(rowTitle()).toMatch(new RegExp(`^${activeASAPRelease.metadata.title}`))
    expect(screen.queryByText('Default')).toBeNull()
  })

  it('keeps Default for the row of no variant with variants on', async () => {
    await renderList([version(GROUP_ID)], {variantsEnabled: true})
    await screen.findByTestId('document-versions-flyout-row')
    expect(rowTitle()).toMatch(/^Default/)
  })
})

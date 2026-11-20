import {render, screen, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
} from '../../../releases/__fixtures__/release.fixture'
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

describe('DocumentVersionsFlyoutList audience rows, with variants on', () => {
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

  it('keeps Default for the row of no variant with variants on', async () => {
    await renderList([version(GROUP_ID)], {variantsEnabled: true})
    await screen.findByTestId('document-versions-flyout-row')
    expect(rowTitle()).toMatch(/^Default/)
  })
})

const RELEASES = [activeASAPRelease, activeScheduledRelease, activeUndecidedRelease]

function inRelease(release: (typeof RELEASES)[number]): VersionInfoDocumentStub {
  const stub = version(`versions.${release.name}.${GROUP_ID}`, release.name)
  return {...stub, _system: {...stub._system, release: {_ref: release._id, _weak: true}}}
}

function versionRows(): HTMLElement[] {
  return screen.getAllByTestId('document-versions-flyout-version-row')
}

/** A row's name, its subtitle and the type its mark is drawn for. */
function describeRow(row: HTMLElement) {
  const texts = within(row)
    .getAllByText(/./)
    .map((element) => element.textContent)
  return {
    name: texts[0],
    subtitle: texts[1],
    mark: within(row)
      .getByTestId('document-versions-flyout-version-mark')
      .getAttribute('data-version-type'),
    locked: within(row).queryByTestId('document-versions-flyout-version-lock') !== null,
  }
}

describe('DocumentVersionsFlyoutList version rows, with variants off', () => {
  beforeEach(() => {
    vi.useFakeTimers({toFake: ['Date']})
    vi.setSystemTime(new Date('2026-10-22T13:00:00.000Z'))
    ;(useActiveReleases as Mock<typeof useActiveReleases>).mockReturnValue({
      data: RELEASES,
      byId: new Map(RELEASES.map((release) => [release._id, release])),
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

  afterEach(() => {
    vi.useRealTimers()
  })

  it('case A: lists Published and Draft, each with when it changed and its own mark, then Manage versions', async () => {
    await renderList([version(GROUP_ID), version(`drafts.${GROUP_ID}`, 'drafts')])
    await screen.findByTestId('document-versions-flyout')

    expect(versionRows().map(describeRow)).toEqual([
      {name: 'Published', subtitle: '2 hr ago', mark: 'published', locked: false},
      {name: 'Draft', subtitle: 'Edited 2 hr ago', mark: 'draft', locked: false},
    ])
    expect(screen.queryByTestId('document-versions-flyout-row')).toBeNull()
    expect(screen.queryByText('Default')).toBeNull()
    expect(screen.getByTestId('document-versions-flyout-inventory').textContent).toBe(
      'Manage versions',
    )
  })

  it('case B: lists Published, Draft, then each release with its timing, mark and lock', async () => {
    await renderList([
      inRelease(activeASAPRelease),
      version(`drafts.${GROUP_ID}`, 'drafts'),
      inRelease(activeUndecidedRelease),
      version(GROUP_ID),
      inRelease(activeScheduledRelease),
    ])
    await screen.findByTestId('document-versions-flyout')

    const rows = versionRows().map(describeRow)
    expect(rows.slice(0, 2)).toEqual([
      {name: 'Published', subtitle: '2 hr ago', mark: 'published', locked: false},
      {name: 'Draft', subtitle: 'Edited 2 hr ago', mark: 'draft', locked: false},
    ])
    expect(rows.slice(2)).toEqual(
      expect.arrayContaining([
        {
          name: activeASAPRelease.metadata.title,
          subtitle: 'As soon as possible',
          mark: 'release',
          locked: false,
        },
        {
          name: activeUndecidedRelease.metadata.title,
          subtitle: 'Undecided',
          mark: 'release',
          locked: false,
        },
        expect.objectContaining({
          name: activeScheduledRelease.metadata.title,
          subtitle: expect.stringMatching(/^Scheduled for /),
          mark: 'release',
        }),
      ]),
    )
    expect(rows).toHaveLength(5)
    expect(screen.queryByText('Default')).toBeNull()
    // The inventory lists more than Published and Draft
    expect(screen.getByTestId('document-versions-flyout-inventory')).toHaveTextContent(
      'Manage all versions',
    )
  })

  it('opens the picked version in its perspective', async () => {
    const onPickVersion = vi.fn()
    ;(useDocumentVersions as Mock<typeof useDocumentVersions>).mockReturnValue({
      data: [],
      versions: [version(GROUP_ID), inRelease(activeASAPRelease)],
      error: null,
      loading: false,
    })
    const wrapper = await createTestProvider()
    render(
      <DocumentVersionsFlyoutList
        documentGroupId={GROUP_ID}
        onOpenInventory={() => {}}
        onPick={() => {}}
        onPickVersion={onPickVersion}
      />,
      {wrapper},
    )
    await screen.findByTestId('document-versions-flyout')

    const user = userEvent.setup()
    await user.click(versionRows()[0])
    await user.click(versionRows()[1])
    expect(onPickVersion.mock.calls).toEqual([['published'], [activeASAPRelease.name]])
  })

  it('lists five versions, then counts the others on the inventory row', async () => {
    await renderList([
      version(GROUP_ID),
      version(`drafts.${GROUP_ID}`, 'drafts'),
      ...RELEASES.map(inRelease),
      inRelease({...activeASAPRelease, _id: '_.releases.rExtra', name: 'rExtra'}),
    ])
    await screen.findByTestId('document-versions-flyout')

    expect(versionRows()).toHaveLength(5)
    expect(screen.getByTestId('document-versions-flyout-hidden-count')).toHaveTextContent('+1')
  })
})

import {render, screen, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {PerspectiveProvider} from '../../../perspective/PerspectiveProvider'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {useDocumentVersions} from '../../../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {type DocumentPresence} from '../../../store/presence/types'
import {ColorSchemeProvider} from '../../../studio/colorScheme'
import {UserColorManagerProvider} from '../../../user-color/provider'
import {createMockVariant} from '../../../variants/__fixtures__/createMockVariant'
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

describe('DocumentVersionsFlyoutList audiences', () => {
  const german = {...createMockVariant('german'), metadata: {title: 'German'}}
  const swedish = {...createMockVariant('swedish', 1), metadata: {title: 'Swedish'}}

  function audienceVersion(id: string, variantId?: string): VersionInfoDocumentStub {
    const stub = version(id, 'drafts')
    return variantId
      ? {...stub, _system: {...stub._system, variants: [{_ref: variantId, _key: variantId}]}}
      : stub
  }

  const audienceVersions = [
    audienceVersion(`drafts.${GROUP_ID}`),
    audienceVersion(`versions.german.${GROUP_ID}`, german._id),
    audienceVersion(`versions.swedish.${GROUP_ID}`, swedish._id),
  ]

  function mockVersions(list: VersionInfoDocumentStub[]) {
    ;(useDocumentVersions as Mock<typeof useDocumentVersions>).mockReturnValue({
      data: list.map((v) => v._id),
      versions: list,
      error: null,
      loading: false,
    })
  }

  function mockVariants(variants: ReturnType<typeof createMockVariant>[]) {
    ;(useAllVariants as Mock<typeof useAllVariants>).mockReturnValue({
      data: variants,
      byId: new Map(variants.map((variant) => [variant._id, variant])),
      loading: false,
      error: undefined,
    })
  }

  function person(id: string, displayName: string, documentId: string) {
    return {
      user: {id, displayName},
      sessionId: `session-${id}`,
      documentId,
      lastActiveAt: '2026-10-22T11:00:00.000Z',
    }
  }

  async function renderAudiences(
    options: {
      onPick?: Mock
      onOpenInventory?: Mock
      presence?: Omit<DocumentPresence, 'path'>[]
      /** The audience the studio is in, as the `variant` sticky param holds it. */
      selectedVariantName?: string
      viewingDocument?: boolean
    } = {},
  ) {
    const wrapper = await createTestProvider({config: {beta: {variants: {enabled: true}}}})
    render(
      <ColorSchemeProvider scheme="light">
        <UserColorManagerProvider>
          <PerspectiveProvider
            selectedPerspectiveName={undefined}
            selectedVariantName={options.selectedVariantName}
          >
            <DocumentVersionsFlyoutList
              documentGroupId={GROUP_ID}
              onOpenInventory={options.onOpenInventory ?? vi.fn()}
              onPick={options.onPick ?? vi.fn()}
              presence={options.presence}
              viewingDocument={options.viewingDocument}
            />
          </PerspectiveProvider>
        </UserColorManagerProvider>
      </ColorSchemeProvider>,
      {wrapper},
    )
    await screen.findByTestId('document-versions-flyout')
  }

  const menuItem = (name: RegExp) => screen.getByRole('menuitem', {name})

  beforeEach(() => {
    ;(useActiveReleases as Mock<typeof useActiveReleases>).mockReturnValue({
      data: [activeASAPRelease],
      byId: new Map([[activeASAPRelease._id, activeASAPRelease]]),
      loading: false,
      error: undefined,
    } as ReturnType<typeof useActiveReleases>)
    mockVariants([german, swedish])
    mockVersions(audienceVersions)
  })

  it('picks the audience of the row, and the footer opens the inventory', async () => {
    const onPick = vi.fn()
    const onOpenInventory = vi.fn()
    await renderAudiences({onPick, onOpenInventory})
    const user = userEvent.setup()

    await user.click(menuItem(/German/))
    expect(onPick).toHaveBeenLastCalledWith(german._id)
    await user.click(menuItem(/Default/))
    expect(onPick).toHaveBeenLastCalledWith(null)
    await user.click(screen.getByTestId('document-versions-flyout-inventory'))
    expect(onOpenInventory).toHaveBeenCalledTimes(1)
  })

  describe('the current audience', () => {
    it('marks the version the pane is viewing', async () => {
      await renderAudiences({selectedVariantName: 'variant:german', viewingDocument: true})
      expect(menuItem(/German/)).toHaveAttribute('aria-current', 'true')
      expect(menuItem(/German/)).toHaveAttribute('data-viewed')
      expect(menuItem(/Default/)).not.toHaveAttribute('aria-current')
      expect(menuItem(/Swedish/)).not.toHaveAttribute('aria-current')
    })

    it('marks the variant picked in the studio on a document that is not open', async () => {
      await renderAudiences({selectedVariantName: 'variant:german', viewingDocument: false})
      expect(menuItem(/German/)).toHaveAttribute('aria-current', 'true')
      expect(menuItem(/German/)).toHaveAttribute('data-picked')
      expect(menuItem(/German/)).not.toHaveAttribute('data-viewed')
      expect(menuItem(/Swedish/)).not.toHaveAttribute('aria-current')
      expect(menuItem(/Default/)).not.toHaveAttribute('aria-current')
    })

    it('marks Default as viewed when the open document has no version for the picked variant', async () => {
      mockVersions([audienceVersions[0], audienceVersions[2]])
      await renderAudiences({selectedVariantName: 'variant:german', viewingDocument: true})
      expect(menuItem(/Default/)).toHaveAttribute('data-viewed')
      expect(menuItem(/Swedish/)).not.toHaveAttribute('data-viewed')
    })

    it('marks nothing with no variant picked', async () => {
      await renderAudiences({viewingDocument: false})
      expect(
        screen
          .getAllByRole('menuitem')
          .some((row) => row.hasAttribute('aria-current') || row.hasAttribute('data-picked')),
      ).toBe(false)
    })
  })

  describe('who is editing', () => {
    it('spends no room on avatars when nobody is editing', async () => {
      await renderAudiences()
      expect(screen.queryAllByTestId('document-versions-flyout-row-presence')).toHaveLength(0)
    })

    it('shows who is editing on the rows, with no first line', async () => {
      await renderAudiences({
        presence: [person('madison', 'Madison Baker', `versions.german.${GROUP_ID}`)],
      })
      expect(screen.queryByTestId('document-versions-flyout-presence')).toBeNull()
      expect(screen.getAllByTestId('document-versions-flyout-avatars')).toHaveLength(1)
    })

    it('puts each avatar on the audience being edited, and leaves other rows alone', async () => {
      await renderAudiences({
        presence: [
          person('madison', 'Madison Baker', `versions.german.${GROUP_ID}`),
          person('pedro', 'Pedro Hall', `drafts.${GROUP_ID}`),
          person('ana', 'Ana Ruiz', `drafts.${GROUP_ID}`),
        ],
      })
      expect(screen.getByRole('img', {name: 'Madison Baker is editing'})).toBeInTheDocument()
      expect(
        screen.getByRole('img', {name: 'Pedro Hall and 1 other are editing'}),
      ).toBeInTheDocument()

      const [defaultColumn, germanColumn, swedishColumn] = screen
        .getAllByTestId('document-versions-flyout-row')
        .map((row) => row.querySelector('[data-testid="document-versions-flyout-row-presence"]'))
      const stackSize = (column: Element) =>
        column.querySelector('[data-ui="AvatarStack"]')?.children.length ?? 0
      expect(stackSize(defaultColumn!)).toBe(2)
      expect(stackSize(germanColumn!)).toBe(1)
      expect(germanColumn!.textContent).toBe('MB')
      expect(swedishColumn).toBeNull()
      expect(
        within(screen.getByTestId('document-versions-flyout-inventory')).queryByTestId(
          'document-versions-flyout-row-presence',
        ),
      ).toBeNull()
    })

    it('shows at most two avatars, then a count', async () => {
      await renderAudiences({
        presence: ['a', 'b', 'c', 'd'].map((id) =>
          person(id, `Person ${id}`, `drafts.${GROUP_ID}`),
        ),
      })
      expect(
        screen.getByRole('img', {name: 'Person a and 3 others are editing'}),
      ).toBeInTheDocument()
      const [defaultColumn] = screen
        .getAllByTestId('document-versions-flyout-row')
        .map((row) => row.querySelector('[data-testid="document-versions-flyout-row-presence"]')!)
      expect(defaultColumn.textContent).toContain('2')
      expect(defaultColumn.querySelector('[data-ui="AvatarStack"]')!.children).toHaveLength(3)
    })
  })

  it('reads lead · detail on an audience row', async () => {
    const scheduledRelease = {
      ...activeASAPRelease,
      _id: '_.releases.rFriday',
      name: 'rFriday',
      state: 'scheduled' as const,
      publishAt: '2099-11-27T09:00:00.000Z',
      metadata: {
        ...activeASAPRelease.metadata,
        releaseType: 'scheduled' as const,
        intendedPublishAt: '2099-11-27T09:00:00.000Z',
        title: 'Friday launch',
      },
    }
    ;(useActiveReleases as Mock<typeof useActiveReleases>).mockReturnValue({
      data: [scheduledRelease],
      byId: new Map([[scheduledRelease._id, scheduledRelease]]),
      loading: false,
      error: undefined,
    } as ReturnType<typeof useActiveReleases>)
    const stub = version(`versions.${scheduledRelease.name}.${GROUP_ID}`, scheduledRelease.name)
    mockVersions([
      {...stub, _system: {...stub._system, release: {_ref: scheduledRelease._id, _weak: true}}},
    ])
    await renderAudiences()

    const row = menuItem(/Default/)
    expect(within(row).getByTestId('document-versions-flyout-row-lead').textContent).toMatch(
      /^First publish scheduled /,
    )
    expect(within(row).getByTestId('document-versions-flyout-row-detail').textContent).toContain(
      'Friday launch',
    )
  })

  describe('with more audiences than the flyout lists', () => {
    const audiences = Array.from({length: 7}, (_, index) => ({
      ...createMockVariant(`audience-${index}`, index),
      metadata: {title: `Audience ${index}`},
    }))
    const list = audiences.map((audience, index) =>
      audienceVersion(`versions.audience${index}.${GROUP_ID}`, audience._id),
    )

    beforeEach(() => {
      mockVariants(audiences)
      mockVersions(list)
    })

    it('shows at most five audiences, and the footer counts the others it opens in the inventory', async () => {
      const onOpenInventory = vi.fn()
      await renderAudiences({onOpenInventory})

      const footer = screen.getByTestId('document-versions-flyout-inventory')
      expect(screen.getAllByTestId('document-versions-flyout-row')).toHaveLength(5)
      expect(footer.textContent).toMatch(/^Manage all versions/)
      const hiddenCount = within(footer).getByTestId('document-versions-flyout-hidden-count')
      expect(hiddenCount).toHaveTextContent('+2')
      expect(hiddenCount).toHaveAccessibleName('2 more')
      // Still the last menu item, so the host's arrow keys reach it after the audience rows
      const rows = screen.getAllByRole('menuitem')
      expect(rows).toHaveLength(6)
      expect(rows.at(-1)).toBe(footer)

      await userEvent.setup().click(footer)
      expect(onOpenInventory).toHaveBeenCalledTimes(1)
    })

    it('puts the people on audiences it leaves out on the footer row, so nobody disappears', async () => {
      await renderAudiences({
        presence: [
          person('listed', 'Listed Person', list[0]._id),
          person('six', 'Sixth Person', list[5]._id),
          person('seven', 'Seventh Person', list[6]._id),
          person('other', 'Other Person', list[6]._id),
        ],
      })

      const footerAvatars = within(
        screen.getByTestId('document-versions-flyout-inventory'),
      ).getByTestId('document-versions-flyout-avatars')
      expect(footerAvatars.getAttribute('aria-label')).toBe('Sixth Person and 2 others are editing')
      expect(footerAvatars.querySelector('[data-ui="AvatarStack"]')!.children).toHaveLength(3)
      expect(screen.getAllByRole('img', {name: 'Listed Person is editing'})).toHaveLength(1)
    })
  })
})

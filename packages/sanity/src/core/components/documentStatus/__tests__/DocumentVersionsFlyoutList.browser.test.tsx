import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, server, userEvent} from 'vitest/browser'

import {expectStable, testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {PerspectiveProvider} from '../../../perspective/PerspectiveProvider'
import {activeASAPRelease} from '../../../releases/__fixtures__/release.fixture'
import {useDocumentVersions} from '../../../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {type DocumentPresence} from '../../../store/presence/types'
import {setSnapshot} from '../../../studio/colorSchemeStore'
import {createMockVariant} from '../../../variants/__fixtures__/createMockVariant'
import {useAllVariants} from '../../../variants/store/useAllVariants'
import {DocumentVersionsFlyoutList} from '../DocumentVersionsFlyoutList'

vi.mock('../../../releases/hooks/useDocumentVersions', () => ({useDocumentVersions: vi.fn()}))
vi.mock('../../../releases/store/useActiveReleases', () => ({useActiveReleases: vi.fn()}))
vi.mock('../../../variants/store/useAllVariants', () => ({useAllVariants: vi.fn()}))

const GROUP_ID = 'article-1'
const german = {...createMockVariant('german'), metadata: {title: 'German'}}
const swedish = {...createMockVariant('swedish', 1), metadata: {title: 'Swedish'}}

function version(id: string, variantId?: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _type: 'article',
    _rev: `${id}-rev`,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-10-22T11:00:00.000Z',
    _system: {
      bundleId: 'drafts',
      group: {_ref: GROUP_ID, _weak: true},
      ...(variantId ? {variants: [{_ref: variantId, _weak: true}]} : {}),
    },
  } as VersionInfoDocumentStub
}

const versions = [
  version(`drafts.${GROUP_ID}`),
  version(`versions.german.${GROUP_ID}`, german._id),
  version(`versions.swedish.${GROUP_ID}`, swedish._id),
]

function renderFlyoutList(
  options: {
    onPick?: Mock
    onOpenInventory?: Mock
    presence?: Omit<DocumentPresence, 'path'>[]
    /** Whether the studio has Variants on: then every row is an audience with a lead and a detail. */
    variantsEnabled?: boolean
    /** The audience the studio is in, as the `variant` sticky param holds it. */
    selectedVariantName?: string
    viewingDocument?: boolean
  } = {},
) {
  return render(
    <TestWrapper
      schemaTypes={[]}
      betaFeatures={{variants: {enabled: options.variantsEnabled ?? true}}}
    >
      <PerspectiveProvider
        selectedPerspectiveName={undefined}
        selectedVariantName={options.selectedVariantName}
      >
        <div style={{width: 400}}>
          <DocumentVersionsFlyoutList
            documentGroupId={GROUP_ID}
            onOpenInventory={options.onOpenInventory ?? vi.fn()}
            onPick={options.onPick ?? vi.fn()}
            presence={options.presence}
            viewingDocument={options.viewingDocument}
          />
        </div>
      </PerspectiveProvider>
    </TestWrapper>,
  )
}

/** The relative luminance of a computed `rgb()` colour (WCAG 2). */
function luminance(color: string): number {
  const [r, g, b] = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map((value) => {
    const channel = Number(value) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** The WCAG contrast ratio of two computed colours. */
function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

/**
 * The selected blue, as computed colours, from the `@sanity/ui` 5 palette primitives. Studio keeps
 * the blue selected colour, so these are the primitives, not UI 5's `--active-*` tokens (grey since
 * 5.0.0-alpha.24).
 */
const SELECTED_BLUE = {
  light: {
    strong: 'rgb(64, 67, 231)', // blue-600
    title: 'rgb(255, 255, 255)', // white
    pale: 'rgb(245, 248, 255)', // blue-50
  },
  dark: {
    strong: 'rgb(117, 149, 255)', // blue-400
    title: 'rgb(19, 20, 27)', // black
    pale: 'rgb(16, 18, 40)', // blue-950
  },
} as const

/** The colour a status mark paints: its fill, or its stroke where it has no fill. */
function markColor(svg: Element): string {
  const shape = svg.querySelector('path, rect, polygon') ?? svg
  const {fill, stroke} = getComputedStyle(shape)
  return fill && fill !== 'none' ? fill : stroke
}

/** Resolves a CSS color expression to the computed color it has inside `element`. */
function resolvedColor(element: Element, color: string): string {
  const probe = document.createElement('span')
  probe.style.color = color
  element.append(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return resolved
}

/**
 * The colour of UI 5's focus outline (`--focus-outline`, a `2px solid <colour>` shorthand) inside
 * `element`, read from the theme rather than pinned, since UI 5 changes its step between releases.
 */
function resolvedFocusOutlineColor(element: Element): string {
  const probe = document.createElement('span')
  probe.style.outline = 'var(--focus-outline)'
  element.append(probe)
  const resolved = getComputedStyle(probe).outlineColor
  probe.remove()
  return resolved
}

beforeEach(() => {
  ;(useDocumentVersions as Mock<typeof useDocumentVersions>).mockReturnValue({
    data: versions.map((v) => v._id),
    versions,
    error: null,
    loading: false,
  })
  ;(useActiveReleases as Mock<typeof useActiveReleases>).mockReturnValue({
    data: [activeASAPRelease],
    byId: new Map([[activeASAPRelease._id, activeASAPRelease]]),
    loading: false,
    error: undefined,
  } as ReturnType<typeof useActiveReleases>)
  ;(useAllVariants as Mock<typeof useAllVariants>).mockReturnValue({
    data: [german, swedish],
    byId: new Map([
      [german._id, german],
      [swedish._id, swedish],
    ]),
    loading: false,
    error: undefined,
  })
})

describe('DocumentVersionsFlyoutList', () => {
  it('picks the audience of the row, and the footer opens the inventory', async () => {
    const onPick = vi.fn()
    const onOpenInventory = vi.fn()
    await renderFlyoutList({onPick, onOpenInventory})

    await page.getByRole('menuitem', {name: /German/}).click()
    expect(onPick).toHaveBeenLastCalledWith(german._id)
    await page.getByRole('menuitem', {name: /Default/}).click()
    expect(onPick).toHaveBeenLastCalledWith(null)
    await page.getByRole('menuitem', {name: 'Manage all versions', exact: true}).click()
    expect(onOpenInventory).toHaveBeenCalledTimes(1)
  })

  describe.each(['light', 'dark'] as const)('in %s mode', (scheme) => {
    beforeEach(() => setSnapshot(scheme))
    afterEach(() => setSnapshot('system'))

    it('puts the status marks in one column at the right edge, with the titles flush left', async () => {
      const {settleChromaticEndState} = testHelpers()
      await renderFlyoutList()
      await expect.element(page.getByRole('menuitem', {name: /Swedish/})).toBeVisible()

      const rows = page.getByRole('menuitem').elements()
      expect(rows).toHaveLength(4)
      const marks = page.getByTestId('document-versions-flyout-row-marks').elements()
      expect(marks).toHaveLength(4)

      const rights = marks.map((mark) => mark.getBoundingClientRect().right)
      const lefts = marks.map((mark) => mark.getBoundingClientRect().left)
      // One aligned column on every row, the footer's chevron included
      for (const right of rights) expect(right).toBeCloseTo(rights[0], 0)
      for (const left of lefts) expect(left).toBeCloseTo(lefts[0], 0)
      rows.forEach((row, index) => {
        // At the right edge of its row: only the row's padding after it
        expect(row.getBoundingClientRect().right - rights[index]).toBeLessThanOrEqual(9)
      })

      // The variant diamonds are inside the column; the default row's column is empty
      const audienceRows = page.getByTestId('document-versions-flyout-row').elements()
      expect(audienceRows).toHaveLength(3)
      const [defaultMarks, germanMarks, swedishMarks] = audienceRows.map((row) =>
        row.querySelector('[data-testid="document-versions-flyout-row-marks"]')!,
      )
      expect(defaultMarks.querySelector('svg')).toBeNull()
      for (const column of [germanMarks, swedishMarks]) {
        const diamond = column.querySelector('svg')!.getBoundingClientRect()
        const box = column.getBoundingClientRect()
        expect(diamond.left).toBeGreaterThanOrEqual(box.left - 1)
        expect(diamond.right).toBeLessThanOrEqual(box.right + 1)
      }

      // Titles start at the same place on every audience row, before the marks
      const titles = ['Default', 'German', 'Swedish'].map((name) =>
        page.getByText(name, {exact: true}).element().getBoundingClientRect(),
      )
      for (const title of titles) expect(title.left).toBeCloseTo(titles[0].left, 0)
      expect(titles[0].left - audienceRows[0].getBoundingClientRect().left).toBeLessThanOrEqual(13)

      // Hover and keyboard focus take the grey of moving through the rows, not a blue
      const hoverGrey = resolvedColor(rows[1], 'light-dark(var(--gray-50), var(--gray-900))')
      await page.getByRole('menuitem', {name: /German/}).hover()
      await expect
        .element(page.getByRole('menuitem', {name: /German/}))
        .toHaveStyle({backgroundColor: hoverGrey})
      await userEvent.unhover(page.getByRole('menuitem', {name: /German/}))
      // React focus state is chromium-only in practice: headless Firefox shares window focus
      // across the test pages, so a row can lose `onFocus` while `document.activeElement` holds
      if (server.browser !== 'firefox') {
        // Keyboard focus, as the host gives it on ArrowDown: a key press, then focus
        await userEvent.keyboard('{ArrowDown}')
        ;(rows[2] as HTMLElement).focus()
        await expect
          .element(page.getByRole('menuitem', {name: /Swedish/}))
          .toHaveStyle({backgroundColor: hoverGrey})
        expect(getComputedStyle(rows[2]).outlineStyle).toBe('solid')
        ;(rows[2] as HTMLElement).blur()
      }

      // The footer row moves through in the same grey
      const footer = page.getByTestId('document-versions-flyout-inventory')
      await footer.hover()
      await expect.element(footer).toHaveStyle({backgroundColor: hoverGrey})
      await userEvent.unhover(footer)

      await settleChromaticEndState()
    })

    it('marks the version the pane is viewing with the strong selected blue', async () => {
      const {settleChromaticEndState} = testHelpers()
      await renderFlyoutList({selectedVariantName: 'variant:german', viewingDocument: true})
      const germanRow = page.getByRole('menuitem', {name: /German/})
      await expect.element(germanRow).toBeVisible()

      // Only the open audience is marked, for assistive technology too
      await expect.element(germanRow).toHaveAttribute('aria-current', 'true')
      await expect
        .element(page.getByRole('menuitem', {name: /Default/}))
        .not.toHaveAttribute('aria-current')
      await expect
        .element(page.getByRole('menuitem', {name: /Swedish/}))
        .not.toHaveAttribute('aria-current')

      const row = germanRow.element() as HTMLElement
      const blue = SELECTED_BLUE[scheme].strong
      const title = germanRow.getByText('German', {exact: true}).element()
      const subtitle = germanRow.getByTestId('document-versions-flyout-row-line').element()
      const diamond = row.querySelector('[data-testid="document-versions-flyout-row-marks"] svg')!
      await expect.element(germanRow).toHaveStyle({backgroundColor: blue})
      expect(getComputedStyle(title).color).toBe(SELECTED_BLUE[scheme].title)
      expect(getComputedStyle(subtitle).color).toBe(
        resolvedColor(row, 'light-dark(var(--blue-100), var(--blue-900))'),
      )

      // Readable on the blue: text at least 4.5:1, the diamond at least 3:1
      expect(contrast(getComputedStyle(title).color, blue)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(getComputedStyle(subtitle).color, blue)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(markColor(diamond), blue)).toBeGreaterThanOrEqual(3)

      // Selected wins over hover: it stays blue
      await germanRow.hover()
      await expect.element(germanRow).toHaveAttribute('data-hovered')
      expect(getComputedStyle(row).backgroundColor).toBe(blue)
      await userEvent.unhover(germanRow)

      // And over focus, which shows as the focus outline instead (React focus state: chromium only)
      if (server.browser !== 'firefox') {
        await userEvent.keyboard('{ArrowDown}')
        row.focus()
        await expect.element(germanRow).toHaveAttribute('data-focused')
        expect(getComputedStyle(row).backgroundColor).toBe(blue)
        expect(getComputedStyle(row).outlineStyle).toBe('solid')
        expect(getComputedStyle(row).outlineColor).toBe(resolvedFocusOutlineColor(row))
      }

      await settleChromaticEndState()
    })

    it('marks the variant picked in the studio with the pale blue on a document that is not open', async () => {
      const {settleChromaticEndState} = testHelpers()
      await renderFlyoutList({selectedVariantName: 'variant:german', viewingDocument: false})
      const germanRow = page.getByRole('menuitem', {name: /German/})
      await expect.element(germanRow).toBeVisible()

      // The picked audience is the current one, for assistive technology too
      await expect.element(germanRow).toHaveAttribute('aria-current', 'true')
      await expect.element(germanRow).toHaveAttribute('data-picked')
      await expect
        .element(page.getByRole('menuitem', {name: /Swedish/}))
        .not.toHaveAttribute('aria-current')
      await expect
        .element(page.getByRole('menuitem', {name: /Default/}))
        .not.toHaveAttribute('aria-current')

      // The quiet checked-row tint, not the open version's strong blue, and the text keeps its colours
      const row = germanRow.element() as HTMLElement
      const paleBlue = SELECTED_BLUE[scheme].pale
      await expect.element(germanRow).toHaveStyle({backgroundColor: paleBlue})
      expect(paleBlue).not.toBe(SELECTED_BLUE[scheme].strong)
      expect(row.hasAttribute('data-viewed')).toBe(false)

      // It stays pale blue while hovered
      await germanRow.hover()
      await expect.element(germanRow).toHaveAttribute('data-hovered')
      expect(getComputedStyle(row).backgroundColor).toBe(paleBlue)
      await userEvent.unhover(germanRow)

      await settleChromaticEndState()
    })

    it('marks nothing with no variant picked', async () => {
      await renderFlyoutList({viewingDocument: false})
      await expect.element(page.getByRole('menuitem', {name: /German/})).toBeVisible()
      expect(
        page
          .getByRole('menuitem')
          .elements()
          .some((r) => r.hasAttribute('aria-current') || r.hasAttribute('data-picked')),
      ).toBe(false)
    })
  })

  // React focus state is chromium-only in practice (see above)
  it.skipIf(server.browser === 'firefox')(
    'draws the focus outline for keyboard focus only, not for a mouse press',
    async () => {
      await renderFlyoutList()
      const germanRow = page.getByRole('menuitem', {name: /German/})
      await expect.element(germanRow).toBeVisible()
      const row = germanRow.element() as HTMLElement

      // A mouse press focuses the button, but draws no outline
      await germanRow.click()
      expect(document.activeElement).toBe(row)
      expect(row.hasAttribute('data-focused')).toBe(false)
      expect(getComputedStyle(row).outlineStyle).toBe('none')
      row.blur()

      // Keyboard focus, as the host gives it on ArrowDown, draws the outline
      const swedishRow = page.getByRole('menuitem', {name: /Swedish/})
      await userEvent.keyboard('{ArrowDown}')
      ;(swedishRow.element() as HTMLElement).focus()
      await expect.element(swedishRow).toHaveAttribute('data-focused')
      expect(getComputedStyle(swedishRow.element()).outlineStyle).toBe('solid')
    },
  )

  it('keeps the rows 8px from every side of the panel', async () => {
    await renderFlyoutList()
    const card = page.getByTestId('document-versions-flyout')
    await expect.element(card).toBeVisible()

    const geometry = () => {
      const panel = card.element()
      const rows = [...panel.querySelectorAll('[role="menuitem"]')]
      const first = rows[0].getBoundingClientRect()
      const last = rows[rows.length - 1].getBoundingClientRect()
      const box = panel.getBoundingClientRect()
      // From inside the panel's border
      const border = panel.clientLeft
      return {
        left: first.left - box.left - border,
        top: first.top - box.top - panel.clientTop,
        bottom: box.bottom - last.bottom - panel.clientTop,
      }
    }
    await expectStable(() => JSON.stringify(geometry()))

    const {left, top, bottom} = geometry()
    expect(Math.abs(left - 8)).toBeLessThanOrEqual(1)
    expect(Math.abs(top - 8)).toBeLessThanOrEqual(1)
    expect(Math.abs(bottom - 8)).toBeLessThanOrEqual(1)
  })

  describe('who is editing', () => {
    function person(id: string, displayName: string, documentId: string) {
      return {
        user: {id, displayName},
        sessionId: `session-${id}`,
        documentId,
        lastActiveAt: '2026-10-22T11:00:00.000Z',
      }
    }

    it('spends no room on avatars when nobody is editing', async () => {
      await renderFlyoutList()
      await expect.element(page.getByRole('menuitem', {name: /German/})).toBeVisible()
      expect(page.getByTestId('document-versions-flyout-row-presence').elements()).toHaveLength(0)
    })

    it('shows who is editing once, on the rows, with no first line', async () => {
      await renderFlyoutList({
        presence: [person('madison', 'Madison Baker', `versions.german.${GROUP_ID}`)],
      })
      await expect.element(page.getByRole('menuitem', {name: /German/})).toBeVisible()
      expect(page.getByTestId('document-versions-flyout-presence').elements()).toHaveLength(0)
      // The avatars' closed tooltip stays mounted (hidden) with the same words: only text on screen
      // would be a first line
      expect(
        page
          .getByText(/are editing|is editing/)
          .elements()
          .filter((element) => element.checkVisibility()),
      ).toHaveLength(0)
      expect(page.getByTestId('document-versions-flyout-avatars').elements()).toHaveLength(1)
    })

    it('names the people on the avatars in a tooltip, on the avatars and not the row', async () => {
      await renderFlyoutList({
        presence: [
          person('pedro', 'Pedro Hall', `drafts.${GROUP_ID}`),
          person('ana', 'Ana Ruiz', `drafts.${GROUP_ID}`),
        ],
      })
      const avatars = page.getByRole('img', {name: 'Pedro Hall and 1 other are editing'})
      await expect.element(avatars).toBeVisible()

      const tooltip = page.getByText('Pedro Hall and 1 other are editing')
      // Hovering the row's title shows no tooltip
      await page
        .getByRole('menuitem', {name: /Default/})
        .getByText('Default')
        .hover()
      await new Promise((resolve) => setTimeout(resolve, 600))
      expect(tooltip.elements().some((element) => element.getBoundingClientRect().width > 0)).toBe(
        false,
      )

      await avatars.hover()
      await expect
        .poll(() => tooltip.elements().some((element) => element.getBoundingClientRect().width > 0))
        .toBe(true)
      const shown = tooltip.elements().find((element) => element.getBoundingClientRect().width > 0)!
      // To the left of the avatars, so it covers no other row
      expect(shown.getBoundingClientRect().right).toBeLessThanOrEqual(
        avatars.element().getBoundingClientRect().left + 1,
      )
    })

    it('puts each avatar on the audience being edited, just before the marks, and leaves other rows alone', async () => {
      await renderFlyoutList({
        presence: [
          person('madison', 'Madison Baker', `versions.german.${GROUP_ID}`),
          person('pedro', 'Pedro Hall', `drafts.${GROUP_ID}`),
          person('ana', 'Ana Ruiz', `drafts.${GROUP_ID}`),
        ],
      })
      await expect.element(page.getByRole('img', {name: 'Madison Baker is editing'})).toBeVisible()
      await expect
        .element(page.getByRole('img', {name: 'Pedro Hall and 1 other are editing'}))
        .toBeVisible()

      const audienceRows = page.getByTestId('document-versions-flyout-row').elements()
      const columns = audienceRows.map((row) =>
        row.querySelector('[data-testid="document-versions-flyout-row-presence"]'),
      )
      const [defaultColumn, germanColumn, swedishColumn] = columns
      // Two people on the default audience's draft, one on the German version, none on Swedish:
      // a row with no one has no avatar column, so nothing on it moves
      const stackSize = (column: Element) =>
        column.querySelector('[data-ui="AvatarStack"]')?.children.length ?? 0
      expect(stackSize(defaultColumn!)).toBe(2)
      expect(stackSize(germanColumn!)).toBe(1)
      expect(germanColumn!.textContent).toBe('MB')
      expect(swedishColumn).toBeNull()
      // Nor does the footer, with no one editing the audiences it counts
      expect(
        page
          .getByTestId('document-versions-flyout-inventory')
          .element()
          .querySelector('[data-testid="document-versions-flyout-row-presence"]'),
      ).toBeNull()

      // The columns that are there line up, and end where the marks begin
      const present = [defaultColumn!, germanColumn!]
      const boxes = present.map((column) => column.getBoundingClientRect())
      for (const box of boxes) {
        expect(box.left).toBeCloseTo(boxes[0].left, 0)
        expect(box.right).toBeCloseTo(boxes[0].right, 0)
      }
      present.forEach((column, index) => {
        const marks = column
          .closest('[data-testid="document-versions-flyout-row"]')!
          .querySelector('[data-testid="document-versions-flyout-row-marks"]')!
          .getBoundingClientRect()
        expect(marks.left - boxes[index].right).toBeLessThanOrEqual(9)
        expect(marks.left).toBeGreaterThanOrEqual(boxes[index].right - 1)
      })
    })

    it('shows at most two avatars, then a count', async () => {
      await renderFlyoutList({
        presence: ['a', 'b', 'c', 'd'].map((id) =>
          person(id, `Person ${id}`, `drafts.${GROUP_ID}`),
        ),
      })
      await expect
        .element(page.getByRole('img', {name: 'Person a and 3 others are editing'}))
        .toBeVisible()
      const [defaultColumn] = page
        .getByTestId('document-versions-flyout-row')
        .elements()
        .map((row) => row.querySelector('[data-testid="document-versions-flyout-row-presence"]')!)
      // Two avatars and a counter of 2
      expect(defaultColumn.textContent).toContain('2')
      const stackChildren = defaultColumn.querySelector('[data-ui="AvatarStack"]')!.children
      expect(stackChildren).toHaveLength(3)
      // The column fits them: the stack does not spill over its left edge
      const stackBox = defaultColumn
        .querySelector('[data-ui="AvatarStack"]')!
        .getBoundingClientRect()
      expect(stackBox.left).toBeGreaterThanOrEqual(defaultColumn.getBoundingClientRect().left - 1)
    })
  })

  describe('audience lines', () => {
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
        title: 'A release with a very long name that cannot fit on the line beside the lead',
      },
    }

    function releaseVersion(rel: typeof scheduledRelease): VersionInfoDocumentStub {
      return {
        ...version(`versions.${rel.name}.${GROUP_ID}`),
        _system: {
          bundleId: rel.name,
          group: {_ref: GROUP_ID, _weak: true},
          release: {_ref: rel._id, _weak: true},
        },
      } as VersionInfoDocumentStub
    }

    function mockVersions(list: VersionInfoDocumentStub[], releases = [activeASAPRelease]) {
      ;(useDocumentVersions as Mock<typeof useDocumentVersions>).mockReturnValue({
        data: list.map((v) => v._id),
        versions: list,
        error: null,
        loading: false,
      })
      ;(useActiveReleases as Mock<typeof useActiveReleases>).mockReturnValue({
        data: releases,
        byId: new Map(releases.map((rel) => [rel._id, rel])),
        loading: false,
        error: undefined,
      } as ReturnType<typeof useActiveReleases>)
    }

    it('reads lead · detail, and cuts the detail short before the lead', async () => {
      mockVersions([releaseVersion(scheduledRelease)], [scheduledRelease])
      await renderFlyoutList()
      const row = page.getByRole('menuitem', {name: /Default/})
      await expect.element(row).toBeVisible()

      const lead = row.getByTestId('document-versions-flyout-row-lead').element()
      const detail = row.getByTestId('document-versions-flyout-row-detail').element()
      expect(lead.textContent).toMatch(/^First publish scheduled /)
      expect(detail.textContent).toContain(scheduledRelease.metadata.title)
      // The lead and its date show in full; the long release name is the part cut short
      expect(lead.scrollWidth).toBeLessThanOrEqual(lead.clientWidth)
      expect(detail.scrollWidth).toBeGreaterThan(detail.clientWidth)
      expect(getComputedStyle(detail).textOverflow).toBe('ellipsis')
    })

    it('names the row after its version, not Default, and keeps the line without Variants', async () => {
      mockVersions([version(GROUP_ID), version(`drafts.${GROUP_ID}`)])
      await renderFlyoutList({variantsEnabled: false})
      const row = page.getByTestId('document-versions-flyout-row')
      await expect.element(row).toBeVisible()
      // Both versions carry the same edit time, so the row takes the name of the one listed first
      await expect.element(row).toMatchTextContent(/^(Published|Draft)/)
      await expect.element(row).not.toMatchTextContent(/Default/)
      expect(page.getByTestId('document-versions-flyout-row-line').elements()).toHaveLength(1)
    })
  })

  it('shows at most five audiences, and the footer counts the others it opens in the inventory', async () => {
    const audiences = Array.from({length: 7}, (_, index) => ({
      ...createMockVariant(`audience-${index}`, index),
      metadata: {title: `Audience ${index}`},
    }))
    const list = audiences.map((audience, index) =>
      version(`versions.audience${index}.${GROUP_ID}`, audience._id),
    )
    ;(useDocumentVersions as Mock<typeof useDocumentVersions>).mockReturnValue({
      data: list.map((v) => v._id),
      versions: list,
      error: null,
      loading: false,
    })
    ;(useAllVariants as Mock<typeof useAllVariants>).mockReturnValue({
      data: audiences,
      byId: new Map(audiences.map((audience) => [audience._id, audience])),
      loading: false,
      error: undefined,
    })
    const onOpenInventory = vi.fn()
    await renderFlyoutList({onOpenInventory})

    const footer = page.getByTestId('document-versions-flyout-inventory')
    await expect.element(footer).toBeVisible()
    expect(page.getByTestId('document-versions-flyout-row').elements()).toHaveLength(5)
    // One footer row: the same words as always, with the audiences the flyout leaves out counted
    // at its end, and no separate count row
    await expect.element(footer).toMatchTextContent(/^Manage all versions/)
    await expect
      .element(footer.getByTestId('document-versions-flyout-hidden-count'))
      .toHaveTextContent('+2')
    await expect
      .element(footer.getByTestId('document-versions-flyout-hidden-count'))
      .toHaveAccessibleName('2 more')
    expect(page.getByTestId('document-versions-flyout-more').elements()).toHaveLength(0)
    expect(page.getByText('See all versions in the inventory').elements()).toHaveLength(0)
    const rows = page.getByRole('menuitem').elements()
    expect(rows).toHaveLength(6)
    // Still the last menu item, so the host's arrow keys reach it after the audience rows
    expect(rows.at(-1)).toBe(footer.element())

    await footer.click()
    expect(onOpenInventory).toHaveBeenCalledTimes(1)
  })

  it('puts the people on audiences it leaves out on the footer row, so nobody disappears', async () => {
    const audiences = Array.from({length: 7}, (_, index) => ({
      ...createMockVariant(`audience-${index}`, index),
      metadata: {title: `Audience ${index}`},
    }))
    const list = audiences.map((audience, index) =>
      version(`versions.audience${index}.${GROUP_ID}`, audience._id),
    )
    ;(useDocumentVersions as Mock<typeof useDocumentVersions>).mockReturnValue({
      data: list.map((v) => v._id),
      versions: list,
      error: null,
      loading: false,
    })
    ;(useAllVariants as Mock<typeof useAllVariants>).mockReturnValue({
      data: audiences,
      byId: new Map(audiences.map((audience) => [audience._id, audience])),
      loading: false,
      error: undefined,
    })
    const editing = (id: string, displayName: string, documentId: string) => ({
      user: {id, displayName},
      sessionId: `session-${id}`,
      documentId,
      lastActiveAt: '2026-10-22T11:00:00.000Z',
    })
    await renderFlyoutList({
      presence: [
        editing('listed', 'Listed Person', list[0]._id),
        editing('six', 'Sixth Person', list[5]._id),
        editing('seven', 'Seventh Person', list[6]._id),
        editing('other', 'Other Person', list[6]._id),
      ],
    })

    const footer = page.getByTestId('document-versions-flyout-inventory')
    await expect.element(footer).toMatchTextContent(/Manage all versions/)
    const footerAvatars = footer.getByTestId('document-versions-flyout-avatars')
    await expect.element(footerAvatars).toBeVisible()
    expect(footerAvatars.element().getAttribute('aria-label')).toBe(
      'Sixth Person and 2 others are editing',
    )
    // At most two avatars, then a count
    expect(footerAvatars.element().querySelector('[data-ui="AvatarStack"]')!.children).toHaveLength(
      3,
    )
    // The person on a listed row stays on that row only
    expect(page.getByRole('img', {name: 'Listed Person is editing'}).elements()).toHaveLength(1)
  })
})

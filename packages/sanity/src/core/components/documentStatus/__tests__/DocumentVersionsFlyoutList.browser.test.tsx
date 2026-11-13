import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, server, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {PerspectiveProvider} from '../../../perspective/PerspectiveProvider'
import {activeASAPRelease} from '../../../releases/__fixtures__/release.fixture'
import {useDocumentVersions} from '../../../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
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
    /** The audience the studio is in, as the `variant` sticky param holds it. */
    selectedVariantName?: string
    viewingDocument?: boolean
  } = {},
) {
  return render(
    <TestWrapper schemaTypes={[]} betaFeatures={{variants: {enabled: true}}}>
      <PerspectiveProvider
        selectedPerspectiveName={undefined}
        selectedVariantName={options.selectedVariantName}
      >
        <div style={{width: 400}}>
          <DocumentVersionsFlyoutList
            documentGroupId={GROUP_ID}
            onOpenInventory={options.onOpenInventory ?? vi.fn()}
            onPick={options.onPick ?? vi.fn()}
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
    await page
      .getByRole('menuitem', {name: 'See all versions in the inventory', exact: true})
      .click()
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
      const blue = resolvedColor(row, 'var(--active-background-emphasized)')
      const title = germanRow.getByText('German', {exact: true}).element()
      const subtitle = germanRow.getByText(/Edited/).element()
      const diamond = row.querySelector('[data-testid="document-versions-flyout-row-marks"] svg')!
      await expect.element(germanRow).toHaveStyle({backgroundColor: blue})
      expect(getComputedStyle(title).color).toBe(
        resolvedColor(row, 'var(--active-foreground-emphasized)'),
      )
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
        row.focus()
        await expect.element(germanRow).toHaveAttribute('data-focused')
        expect(getComputedStyle(row).backgroundColor).toBe(blue)
        expect(getComputedStyle(row).outlineStyle).toBe('solid')
        expect(getComputedStyle(row).outlineColor).toBe(resolvedColor(row, 'var(--blue-500)'))
      }

      await settleChromaticEndState()
    })

    it('marks nothing when the row is not the document the pane shows', async () => {
      await renderFlyoutList({selectedVariantName: 'variant:german', viewingDocument: false})
      await expect.element(page.getByRole('menuitem', {name: /German/})).toBeVisible()
      expect(
        page
          .getByRole('menuitem')
          .elements()
          .some((r) => r.hasAttribute('aria-current')),
      ).toBe(false)
    })
  })
})

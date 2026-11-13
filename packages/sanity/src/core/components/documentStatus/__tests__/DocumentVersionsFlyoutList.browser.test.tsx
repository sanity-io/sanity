import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
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

function renderFlyoutList(handlers: {onPick?: Mock; onOpenInventory?: Mock} = {}) {
  return render(
    <TestWrapper schemaTypes={[]} betaFeatures={{variants: {enabled: true}}}>
      <div style={{width: 400}}>
        <DocumentVersionsFlyoutList
          documentGroupId={GROUP_ID}
          onOpenInventory={handlers.onOpenInventory ?? vi.fn()}
          onPick={handlers.onPick ?? vi.fn()}
        />
      </div>
    </TestWrapper>,
  )
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
    await page.getByRole('menuitem', {name: /See all 3 versions/}).click()
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

      // Keyboard focus takes the same highlight as hover
      ;(rows[1] as HTMLElement).focus()
      await expect
        .element(page.getByRole('menuitem', {name: /German/}))
        .toHaveAttribute('data-selected')
      await userEvent.unhover(page.getByRole('menuitem', {name: /German/}))

      await settleChromaticEndState()
    })
  })
})

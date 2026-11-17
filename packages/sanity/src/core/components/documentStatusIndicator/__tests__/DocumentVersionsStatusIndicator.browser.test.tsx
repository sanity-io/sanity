import {configure} from '@chromatic-com/vitest'
import {type DocumentSystem} from '@sanity/types'
import {Card, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'

import {
  mockUsePerspective,
  usePerspectiveMockReturn,
} from '../../../perspective/__mocks__/usePerspective.mock'
import {type PerspectiveContextValue} from '../../../perspective/types'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {variantAlphaAudience} from '../../../variants/__fixtures__/variants.fixture'
import {DocumentVersionsStatusIndicator} from '../DocumentVersionsStatusIndicator'

vi.mock('../../../perspective/usePerspective', () => ({
  usePerspective: vi.fn(() => usePerspectiveMockReturn),
}))

configure({disableAutoSnapshot: true})

const theme = buildTheme()

const VARIANT_ID = variantAlphaAudience._id
const variantRef = {_ref: VARIANT_ID, _key: 'k-123'} as const

function versionStub(
  groupId: string,
  id: string,
  system: Omit<DocumentSystem, 'group'>,
): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: '',
    _createdAt: '',
    _updatedAt: '',
    _type: 'article',
    _system: {group: {_ref: groupId, _weak: true}, ...system},
  }
}

// With a variant selected:
// Row A: [draft, published, filled diamond], two marks, the variant's version
const rowA = [
  versionStub('a', 'published.alpha.a', {variants: [variantRef]}),
  versionStub('a', 'drafts.alpha.a', {bundleId: 'drafts', variants: [variantRef]}),
]
// Row B: [published, filled diamond], one mark, the variant's version
const rowB = [versionStub('b', 'published.alpha.b', {variants: [variantRef]})]
// Row C: [draft, published, outline diamond], two marks describing Default
const rowC = [versionStub('c', 'c', {}), versionStub('c', 'drafts.c', {bundleId: 'drafts'})]
// Row D: [published, outline diamond], one mark describing Default
const rowD = [versionStub('d', 'd', {})]
// Row E: [outline diamond], no marks at all
const rowE: VersionInfoDocumentStub[] = []

const ICON_SLOT_WIDTH = 15

function mockPerspective(override: Partial<PerspectiveContextValue> = {}) {
  mockUsePerspective.mockReturnValue({...usePerspectiveMockReturn, ...override})
}

function Rows({rows}: {rows: VersionInfoDocumentStub[][]}) {
  return (
    <ThemeProvider theme={theme}>
      <div style={{width: 300}}>
        {rows.map((versions, index) => (
          <div
            // oxlint-disable-next-line react/no-array-index-key -- fixed test rows
            key={index}
            data-testid={`row-${index}`}
            style={{display: 'flex', justifyContent: 'flex-end', height: 33}}
          >
            <DocumentVersionsStatusIndicator documentVersions={versions} />
          </div>
        ))}
      </div>
    </ThemeProvider>
  )
}

function cluster(row: number): Element | null {
  return document.querySelector(
    `[data-testid="row-${row}"] [data-testid="document-status-indicator"]`,
  )
}

function clusterWidth(row: number): number {
  const el = cluster(row)
  return el ? el.getBoundingClientRect().width : 0
}

/** The diamond glyph of a row, filled or outline. */
function diamond(row: number): {kind: 'filled' | 'outline'; x: number} | undefined {
  const el = document.querySelector(`[data-testid="row-${row}"] [data-ui="VariantMark"]`)
  if (!el) return undefined
  const rect = el.getBoundingClientRect()
  return {
    kind: el.getAttribute('data-fill') === 'outline' ? 'outline' : 'filled',
    x: rect.left + rect.width / 2,
  }
}

/** The 15px slots of a row, in DOM order. */
function slotRects(row: number): DOMRect[] {
  const el = cluster(row)
  return el ? Array.from(el.children).map((child) => child.getBoundingClientRect()) : []
}

describe('DocumentVersionsStatusIndicator alignment', () => {
  beforeEach(() => {
    mockPerspective()
  })

  it('ends every row with a filled or outline diamond in one column with a variant selected', async () => {
    mockPerspective({
      selectedVariants: [variantAlphaAudience],
      selectedVariantNames: ['alpha-audience'],
    })
    await render(<Rows rows={[rowA, rowB, rowC, rowD, rowE]} />)

    const rows = [
      {row: 0, kind: 'filled', marks: 2},
      {row: 1, kind: 'filled', marks: 1},
      {row: 2, kind: 'outline', marks: 2},
      {row: 3, kind: 'outline', marks: 1},
      {row: 4, kind: 'outline', marks: 0},
    ]

    const diamonds = rows.map(({row}) => diamond(row))
    rows.forEach(({kind}, index) => {
      expect(diamonds[index]?.kind).toBe(kind)
    })

    const firstX = diamonds[0]!.x
    for (const found of diamonds) {
      expect(Math.abs(found!.x - firstX)).toBeLessThanOrEqual(0.5)
    }

    for (const {row, marks} of rows) {
      const slots = slotRects(row)
      expect(slots).toHaveLength(marks + 1)
      // The marks sit directly before the diamond: each slot starts where the previous one ends.
      for (let index = 1; index < slots.length; index++) {
        expect(Math.abs(slots[index].left - slots[index - 1].right)).toBeLessThanOrEqual(0.5)
        expect(
          Math.abs(
            slots[index].left +
              slots[index].width / 2 -
              (slots[index - 1].left + slots[index - 1].width / 2),
          ),
        ).toBeLessThanOrEqual(ICON_SLOT_WIDTH + 0.5)
      }
      expect(clusterWidth(row)).toBe(ICON_SLOT_WIDTH * 3)
    }
  })

  it('packs the icons with no diamond and no variant selected', async () => {
    await render(<Rows rows={[rowC, rowD]} />)

    expect(diamond(0)).toBeUndefined()
    expect(diamond(1)).toBeUndefined()
    expect(clusterWidth(0)).toBe(30)
    expect(clusterWidth(1)).toBe(15)
  })
})

describe('DocumentVersionsStatusIndicator on a selected row', () => {
  it('paints the diamond a paler version of its own colour, like the other marks, not white', async () => {
    mockPerspective({
      selectedVariants: [variantAlphaAudience],
      selectedVariantNames: ['alpha-audience'],
    })
    await render(
      <ThemeProvider theme={theme}>
        <Card as="button" selected data-testid="selected-row" padding={2}>
          <DocumentVersionsStatusIndicator documentVersions={rowA} />
        </Card>
      </ThemeProvider>,
    )

    const row = document.querySelector('[data-testid="selected-row"]')!
    expect(row.hasAttribute('data-selected')).toBe(true)
    const mark = row.querySelector('[data-ui="VariantMark"]')!
    const slot = mark.closest('[data-status="variant"]')!

    // Resolve the two tokens on the selected card to colours the browser can compare
    const probe = document.createElement('span')
    slot.append(probe)
    probe.style.color = 'var(--card-badge-suggest-dot-color)'
    const dotColor = getComputedStyle(probe).color
    probe.style.color = 'var(--card-fg-color)'
    const fgColor = getComputedStyle(probe).color
    probe.remove()

    expect(dotColor).not.toBe(fgColor)
    expect(getComputedStyle(mark).color).toBe(dotColor)
  })
})

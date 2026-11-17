import {configure} from '@chromatic-com/vitest'
import {type DocumentSystem} from '@sanity/types'
import {ThemeProvider} from '@sanity/ui'
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

// Row A: [variant, draft, published]
const rowA = [
  versionStub('a', 'published.alpha.a', {variants: [variantRef]}),
  versionStub('a', 'drafts.alpha.a', {bundleId: 'drafts', variants: [variantRef]}),
]
// Row B: [variant, published]
const rowB = [versionStub('b', 'published.alpha.b', {variants: [variantRef]})]
// Row C: no variant document, [draft, published]
const rowC = [versionStub('c', 'c', {}), versionStub('c', 'drafts.c', {bundleId: 'drafts'})]

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

function rowIconX(row: number, icon: string): number | undefined {
  const el = document.querySelector(`[data-testid="row-${row}"] [data-sanity-icon="${icon}"]`)
  if (!el) return undefined
  const rect = el.getBoundingClientRect()
  return rect.left + rect.width / 2
}

function clusterWidth(row: number): number {
  const el = document.querySelector(
    `[data-testid="row-${row}"] [data-testid="document-status-indicator"]`,
  )
  return el ? el.getBoundingClientRect().width : 0
}

describe('DocumentVersionsStatusIndicator alignment', () => {
  beforeEach(() => {
    mockPerspective()
  })

  it('keeps the variant rhombus and the published disc in one column with a variant selected', async () => {
    mockPerspective({
      selectedVariants: [variantAlphaAudience],
      selectedVariantNames: ['alpha-audience'],
    })
    await render(<Rows rows={[rowA, rowB, rowC]} />)

    const diamondA = rowIconX(0, 'rhombus')
    const diamondB = rowIconX(1, 'rhombus')
    expect(diamondA).toBeDefined()
    expect(diamondB).toBeDefined()
    expect(Math.abs(diamondA! - diamondB!)).toBeLessThanOrEqual(0.5)
    expect(rowIconX(2, 'rhombus')).toBeUndefined()

    const discs = [0, 1, 2].map((row) => rowIconX(row, 'circle-small')!)
    expect(Math.abs(discs[0] - discs[1])).toBeLessThanOrEqual(0.5)
    expect(Math.abs(discs[0] - discs[2])).toBeLessThanOrEqual(0.5)

    expect(clusterWidth(0)).toBe(45)
    expect(clusterWidth(1)).toBe(45)
    expect(clusterWidth(2)).toBe(45)
  })

  it('packs the icons with no variant selected', async () => {
    await render(<Rows rows={[rowC, [versionStub('d', 'd', {})]]} />)

    expect(clusterWidth(0)).toBe(30)
    expect(clusterWidth(1)).toBe(15)
  })
})

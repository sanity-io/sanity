import {type ReleaseDocument} from '@sanity/client'
import {defineField, defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {type Variant} from '../../machines/selectionMachine'
import {type ServedStatus} from '../../utils/resolveServedVersion'
import {Container} from '../Container'
import {DocumentGroupEntry} from '../DocumentGroupEntry'
import {DocumentGroupSet} from '../DocumentGroupSet'
import {VariantCheckbox} from '../VariantSet/VariantCheckbox'

const PUBLISHED_ID = 'narrow-document'
const DOCUMENT_TYPE = 'author'
const RELEASES = new Map<string, ReleaseDocument>()
const NOOP = () => undefined

const SCHEMA_TYPES = [
  defineType({
    name: DOCUMENT_TYPE,
    type: 'document',
    fields: [defineField({name: 'name', type: 'string'})],
  }),
]

const THREE_WEEKS_AGO = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()

function stub(id: string, bundleId?: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: THREE_WEEKS_AGO,
    _type: DOCUMENT_TYPE,
    _system: {group: {_ref: PUBLISHED_ID, _weak: true}, bundleId},
  }
}

/** The published Default row: "Default", "Published 3 wk ago", and both badges. */
const DEFAULT_ROW: Variant = {id: PUBLISHED_ID, name: 'Default', document: stub(PUBLISHED_ID)}

/** A variant whose name is far longer than any narrow panel. */
const LONG_NAME_ROW: Variant = {
  id: `drafts.long.${PUBLISHED_ID}`,
  name: 'Returningcustomersinthenordicmarketsduringthespringcampaign',
  document: {
    ...stub(`drafts.long.${PUBLISHED_ID}`, 'drafts'),
    _system: {
      group: {_ref: PUBLISHED_ID, _weak: true},
      bundleId: 'drafts',
      variants: [{_key: 'long', _ref: '_.variants.returning-customers'}],
    },
  },
}

const ROWS: {variant: Variant; isSelected: boolean; servedStatus?: ServedStatus}[] = [
  {variant: DEFAULT_ROW, isSelected: true, servedStatus: 'primary'},
  {variant: LONG_NAME_ROW, isSelected: false, servedStatus: 'secondary'},
]

/** The inventory panel at a given width, the way the inspector hosts it. */
function NarrowPanel({width}: {width: number}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <div style={{display: 'flex', flexDirection: 'column', width, height: 400}}>
        <Container>
          <DocumentGroupSet name="Unreleased" selectionState="unchecked" onCheckedChange={NOOP}>
            {ROWS.map(({variant, isSelected, servedStatus}) => (
              <DocumentGroupEntry
                key={variant.id}
                variant={variant}
                releases={RELEASES}
                documentVersions={ROWS.map((row) => row.variant.document)}
                isSelected={isSelected}
                servedStatus={servedStatus}
                showStatusBadges
                onPrimaryAction={NOOP}
                leading={
                  <VariantCheckbox
                    label={`Select ${variant.name}`}
                    checked={false}
                    onChange={NOOP}
                  />
                }
              />
            ))}
          </DocumentGroupSet>
        </Container>
      </div>
    </TestWrapper>
  )
}

function getRow(variant: Variant): HTMLElement {
  const row = document.querySelector<HTMLElement>(`[data-variant-name="${variant.name}"]`)
  if (!row) throw new Error(`Expected the "${variant.name}" row to have rendered`)
  return row
}

function getPart(row: HTMLElement, testId: string): HTMLElement {
  const part = row.querySelector<HTMLElement>(`[data-testid="${testId}"]`)
  if (!part) throw new Error(`Expected the row to render "${testId}"`)
  return part
}

/** How many lines the text of an element is laid out on. */
function countLines(element: HTMLElement): number {
  const range = document.createRange()
  range.selectNodeContents(element)
  const tops = new Set(
    [...range.getClientRects()]
      .filter((rect) => rect.width > 0)
      .map((rect) => Math.round(rect.top)),
  )
  return tops.size
}

function measure(variant: Variant) {
  const row = getRow(variant)
  const lines = getPart(row, 'version-lines').getBoundingClientRect()
  const group = getPart(row, 'version-badges')
  const badges = [...group.querySelectorAll<HTMLElement>('[data-badge]')]

  const mark = row.querySelector<HTMLElement>('.variant-mark')!.getBoundingClientRect()

  return {
    row,
    lines,
    /** The text column: the mark column, then the title and the meta. */
    textColumnWidth: lines.right - mark.left,
    group: group.getBoundingClientRect(),
    badges,
    badgeTops: new Set(badges.map((badge) => Math.round(badge.getBoundingClientRect().top))),
    titleLines: countLines(getPart(row, 'version-title')),
    metaLines: countLines(getPart(row, 'version-secondary-line')),
  }
}

describe('DocumentGroupEntry in a narrow panel', () => {
  it.each([
    {width: 420, defaultWraps: false},
    {width: 320, defaultWraps: false},
    {width: 260, defaultWraps: true},
    {width: 220, defaultWraps: true},
  ])('lays out the rows at $width px', async ({width, defaultWraps}) => {
    const {settleChromaticEndState} = testHelpers()
    void render(<NarrowPanel width={width} />)

    await expect.element(page.getByText('Unreleased')).toBeVisible()
    await settleChromaticEndState()

    for (const {variant} of ROWS) {
      const m = measure(variant)

      // One line each for the title and the meta, never broken inside a word
      expect(m.titleLines).toBe(1)
      expect(m.metaLines).toBe(1)
      expect(getComputedStyle(m.row).wordBreak).not.toBe('break-all')

      // The text column keeps its minimum width
      expect(m.textColumnWidth).toBeGreaterThanOrEqual(140)

      // The badges are one group on one line
      expect(m.badgeTops.size).toBe(1)

      // When the group does not fit beside the text, it sits under it, starting where it starts
      const wrapped = m.group.top >= m.lines.bottom
      if (wrapped) {
        expect(Math.round(m.group.left)).toBe(Math.round(m.lines.left))
      }

      if (variant === DEFAULT_ROW) {
        expect(wrapped).toBe(defaultWraps)
      }

      // The row never grows wider than the panel
      expect(m.row.getBoundingClientRect().width).toBeLessThanOrEqual(width)
      expect(m.lines.right).toBeLessThanOrEqual(m.row.getBoundingClientRect().right)
    }

    // The long name ends in an ellipsis rather than overflowing
    const longTitle = getPart(getRow(LONG_NAME_ROW), 'version-title').parentElement!
    expect(longTitle.scrollWidth).toBeGreaterThan(longTitle.clientWidth)
    expect(getComputedStyle(longTitle).textOverflow).toBe('ellipsis')
  })

  it('orders the badges Editing, Served, then the rest', async () => {
    void render(<NarrowPanel width={260} />)

    await expect.element(page.getByText('Unreleased')).toBeVisible()

    expect(measure(DEFAULT_ROW).badges.map((badge) => badge.dataset.badge)).toEqual([
      'editing',
      'served',
    ])
    expect(measure(DEFAULT_ROW).badges.map((badge) => badge.textContent)).toEqual([
      'Editing',
      'Served',
    ])
  })

  /*
   * One 12px padding, the 17px checkbox, an 8px gap, the 21px icon and mark column and an 8px gap:
   * the text starts 66px in, in the group header and in every row alike.
   */
  it('starts header and row text 66px in at a 300px panel', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<NarrowPanel width={300} />)

    await expect.element(page.getByText('Unreleased')).toBeVisible()
    await settleChromaticEndState()

    const set = document.querySelector<HTMLElement>('[data-variant-set="Unreleased"]')!
    const panelLeft = set.getBoundingClientRect().left
    const headerText = set.querySelector<HTMLElement>('header .variant-set-text')!

    expect(Math.abs(headerText.getBoundingClientRect().left - panelLeft - 66)).toBeLessThanOrEqual(
      1,
    )
    for (const {variant} of ROWS) {
      const lines = getPart(getRow(variant), 'version-lines').getBoundingClientRect()
      expect(Math.abs(lines.left - panelLeft - 66)).toBeLessThanOrEqual(1)
    }

    // 300 - 66 - 12 = 222px for the text
    const row = getRow(DEFAULT_ROW).getBoundingClientRect()
    const textWidth =
      row.right - 12 - getPart(getRow(DEFAULT_ROW), 'version-lines').getBoundingClientRect().left
    expect(Math.abs(textWidth - 222)).toBeLessThanOrEqual(1)
  })

  it('trims the padding to 8px below 240px, so the text starts 62px in', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<NarrowPanel width={220} />)

    await expect.element(page.getByText('Unreleased')).toBeVisible()
    await settleChromaticEndState()

    const set = document.querySelector<HTMLElement>('[data-variant-set="Unreleased"]')!
    const lines = getPart(getRow(DEFAULT_ROW), 'version-lines').getBoundingClientRect()
    expect(Math.abs(lines.left - set.getBoundingClientRect().left - 62)).toBeLessThanOrEqual(1)
  })
})

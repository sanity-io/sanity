import {type ReleaseDocument} from '@sanity/client'
import {defineField, defineType} from '@sanity/types'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {isShown, testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {activeASAPRelease} from '../../../releases/__fixtures__/release.fixture'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {type Variant} from '../../machines/selectionMachine'
import {type ServedVersion} from '../../utils/resolveServedVersion'
import {type GroupSelectionState} from '../../utils/selection'
import {DocumentGroupEntry} from '../DocumentGroupEntry'
import {DocumentGroupSet} from '../DocumentGroupSet'
import {VariantCheckbox} from '../VariantSet/VariantCheckbox'

const PUBLISHED_ID = 'set-document'
const DOCUMENT_TYPE = 'author'
const SET_NAME = activeASAPRelease.metadata.title
const RELEASES = new Map<string, ReleaseDocument>([[activeASAPRelease._id, activeASAPRelease]])

const SCHEMA_TYPES = [
  defineType({
    name: DOCUMENT_TYPE,
    type: 'document',
    fields: [defineField({name: 'name', type: 'string'})],
  }),
]

function variant(id: string, name: string): Variant {
  return {
    id,
    name,
    releaseDocument: activeASAPRelease,
    document: {
      _id: id,
      _rev: 'rev',
      _createdAt: '2026-01-01T00:00:00.000Z',
      _updatedAt: '2026-01-01T00:00:00.000Z',
      _type: DOCUMENT_TYPE,
      _system: {
        group: {_ref: PUBLISHED_ID, _weak: true},
        bundleId: activeASAPRelease.name,
        release: {_ref: activeASAPRelease._id, _weak: true},
      },
    },
  }
}

const SUMMER_SALE = variant(`versions.${activeASAPRelease.name}.summer.${PUBLISHED_ID}`, 'Summer')
const WINTER_SALE = variant(`versions.${activeASAPRelease.name}.winter.${PUBLISHED_ID}`, 'Winter')
const VARIANTS = [SUMMER_SALE, WINTER_SALE]

const NOTHING_SELECTED: ReadonlySet<string> = new Set()
const NOOP = () => undefined

/**
 * Renders a set the way the inventory's `Select` does: the set header and each
 * version row lead with a checkbox, always there.
 */
function SetHarness({
  selectedIds = NOTHING_SELECTED,
  selectionState = 'unchecked',
  onCheckedChange = NOOP,
  onPrimaryAction = NOOP,
  onToggle = NOOP,
  readOnly,
  locked,
  editingId,
  servedVersion,
  showStatusBadges,
  count,
  releases = RELEASES,
  variants = VARIANTS,
}: {
  releases?: Map<string, ReleaseDocument>
  variants?: Variant[]
  count?: number
  editingId?: string
  servedVersion?: ServedVersion
  showStatusBadges?: boolean
  selectedIds?: ReadonlySet<string>
  selectionState?: GroupSelectionState
  onCheckedChange?: (checked: boolean) => void
  onPrimaryAction?: (entry: Variant) => void
  onToggle?: (entry: Variant) => void
  readOnly?: boolean
  locked?: boolean
}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <DocumentGroupSet
        name={SET_NAME}
        count={count}
        bundle={{type: 'perspective', perspective: activeASAPRelease}}
        selectionState={selectionState}
        onCheckedChange={onCheckedChange}
        readOnly={readOnly}
        locked={locked}
      >
        {variants.map((entry) => (
          <DocumentGroupEntry
            key={entry.id}
            variant={entry}
            releases={releases}
            isSelected={entry.id === editingId}
            servedStatus={servedVersion?.id === entry.id ? servedVersion.status : undefined}
            showStatusBadges={showStatusBadges}
            onPrimaryAction={() => onPrimaryAction(entry)}
            leading={
              readOnly ? undefined : (
                <VariantCheckbox
                  label={`Select ${entry.name}`}
                  tabbable={false}
                  checked={selectedIds.has(entry.id)}
                  locked={locked}
                  onChange={() => onToggle(entry)}
                />
              )
            }
          />
        ))}
      </DocumentGroupSet>
    </TestWrapper>
  )
}

function stub(id: string, bundleId?: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: new Date().toISOString(),
    _type: DOCUMENT_TYPE,
    _system: {group: {_ref: PUBLISHED_ID, _weak: true}, bundleId},
  }
}

const DRAFT: Variant = {
  id: `drafts.${PUBLISHED_ID}`,
  name: 'Draft',
  document: stub(`drafts.${PUBLISHED_ID}`, 'drafts'),
}
const PUBLISHED: Variant = {id: PUBLISHED_ID, name: 'Published', document: stub(PUBLISHED_ID)}
const VARIANT_DRAFT: Variant = {
  id: `drafts.variant.${PUBLISHED_ID}`,
  name: 'New customers',
  document: {
    ...stub(`drafts.variant.${PUBLISHED_ID}`, 'drafts'),
    _system: {
      group: {_ref: PUBLISHED_ID, _weak: true},
      bundleId: 'drafts',
      variants: [{_key: 'variant', _ref: '_.variants.new-customers'}],
    },
  },
}

/** A set of the draft and published versions, outside any release. */
function UnreleasedHarness({versions = [DRAFT, PUBLISHED]}: {versions?: Variant[]}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <DocumentGroupSet
        name="Unreleased"
        selectionState="unchecked"
        onCheckedChange={NOOP}
        readOnly
      >
        {versions.map((entry) => (
          <DocumentGroupEntry
            key={entry.id}
            variant={entry}
            releases={RELEASES}
            documentVersions={versions.map((version) => version.document)}
            onPrimaryAction={NOOP}
          />
        ))}
      </DocumentGroupSet>
    </TestWrapper>
  )
}

function getSecondaryLine(row: HTMLElement): HTMLElement {
  const line = row.querySelector<HTMLElement>('[data-testid="version-secondary-line"]')

  if (!line) {
    throw new Error('Expected the row to render a secondary line')
  }

  return line
}

function getSet(): HTMLElement {
  const set = document.querySelector<HTMLElement>(`[data-variant-set="${SET_NAME}"]`)

  if (!set) {
    throw new Error(`Expected the "${SET_NAME}" set to have rendered`)
  }

  return set
}

/** The set's own checkbox, or `null` when the set renders none. */
function getSetCheckbox(): HTMLInputElement | null {
  return getSet().querySelector<HTMLInputElement>('header input[type="checkbox"]')
}

function getSetIcon(): HTMLElement {
  const icon = getSet().querySelector<HTMLElement>('header .variant-set-icon')

  if (!icon) {
    throw new Error('Expected the set to render its icon')
  }

  return icon
}

function getRow(entry: Variant, setName?: string): HTMLElement {
  const root = setName
    ? document.querySelector<HTMLElement>(`[data-variant-set="${setName}"]`)
    : getSet()
  const row = root?.querySelector<HTMLElement>(`[data-variant-name="${entry.name}"]`)

  if (!row) {
    throw new Error(`Expected the "${entry.name}" row to have rendered`)
  }

  return row
}

function getRowCheckbox(entry: Variant): HTMLInputElement {
  const checkbox = getRow(entry).querySelector<HTMLInputElement>('input[type="checkbox"]')

  if (!checkbox) {
    throw new Error(`Expected the "${entry.name}" row to render a checkbox`)
  }

  return checkbox
}

describe('DocumentGroupSet', () => {
  it('shows the set icon and every checkbox at rest, side by side', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<SetHarness />)

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await settleChromaticEndState()

    expect(isShown(getSetIcon())).toBe(true)
    expect(isShown(getSetCheckbox()!)).toBe(true)
    expect(VARIANTS.every((entry) => isShown(getRowCheckbox(entry)))).toBe(true)
    // The icon has its own column; nothing overlays the checkbox's spot.
    expect(getComputedStyle(getSetIcon()).position).toBe('static')
    expect(getSetIcon().getBoundingClientRect().left).toBeGreaterThanOrEqual(
      getSetCheckbox()!.getBoundingClientRect().right,
    )
  })

  it('never swaps the set icon for its checkbox while the set heading is hovered', async () => {
    void render(<SetHarness />)

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await userEvent.hover(page.getByText(SET_NAME))

    expect(isShown(getSetCheckbox()!)).toBe(true)
    expect(isShown(getSetIcon())).toBe(true)
    expect(getComputedStyle(getSetIcon()).visibility).toBe('visible')
  })

  it('keeps every row checkbox visible whether or not its row is hovered', async () => {
    void render(<SetHarness />)

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await userEvent.hover(page.elementLocator(getRow(SUMMER_SALE)))

    expect(isShown(getRowCheckbox(SUMMER_SALE))).toBe(true)
    expect(isShown(getRowCheckbox(WINTER_SALE))).toBe(true)
  })

  it('makes the set checkbox and each row tab stops, but not the row checkboxes', async () => {
    void render(<SetHarness />)

    await expect.element(page.getByText(SET_NAME)).toBeVisible()

    // The set checkbox comes first, even before anything is selected. Then each row: the row is
    // the tab stop, and Space on it toggles its checkbox.
    await userEvent.tab()
    expect(document.activeElement).toBe(getSetCheckbox())
    await userEvent.tab()
    await expect.element(page.getByRole('button', {name: SUMMER_SALE.name})).toHaveFocus()
    await userEvent.tab()
    await expect.element(page.getByRole('button', {name: WINTER_SALE.name})).toHaveFocus()
    expect(getRowCheckbox(SUMMER_SALE).tabIndex).toBe(-1)
  })

  it('names each checkbox after what it selects', async () => {
    void render(<SetHarness />)

    await expect
      .element(page.getByRole('checkbox', {name: `Select all in ${SET_NAME}`}))
      .toBeInTheDocument()
    await expect
      .element(page.getByRole('checkbox', {name: `Select ${SUMMER_SALE.name}`}))
      .toBeInTheDocument()
  })

  it('toggles a version checkbox with the pointer instead of activating its row', async () => {
    const {settleChromaticEndState} = testHelpers()
    const onPrimaryAction = vi.fn<(entry: Variant) => void>()
    const onToggle = vi.fn<(entry: Variant) => void>()
    void render(<SetHarness onPrimaryAction={onPrimaryAction} onToggle={onToggle} />)

    await expect.element(page.getByText(SET_NAME)).toBeVisible()

    // The row's primary action is an invisible overlay spanning the whole row,
    // and it follows the checkbox in the tree. The checkbox must still be the
    // topmost element under the pointer.
    const checkbox = getRowCheckbox(SUMMER_SALE)
    const bounds = checkbox.getBoundingClientRect()
    expect(
      document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2),
    ).toBe(checkbox)

    await userEvent.click(page.elementLocator(checkbox))
    expect(onToggle).toHaveBeenCalledExactlyOnceWith(SUMMER_SALE)
    expect(onPrimaryAction).not.toHaveBeenCalled()

    // The rest of the row still activates the primary action.
    await userEvent.click(page.getByRole('button', {name: SUMMER_SALE.name}))
    expect(onPrimaryAction).toHaveBeenCalledExactlyOnceWith(SUMMER_SALE)
    expect(onToggle).toHaveBeenCalledOnce()

    await settleChromaticEndState()
  })

  it('shows a partly selected set as indeterminate', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <SetHarness selectedIds={new Set([SUMMER_SALE.id])} selectionState="indeterminate" />,
    )

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await settleChromaticEndState()

    expect(getSetCheckbox()).not.toBeChecked()
    expect(getSetCheckbox()!.indeterminate).toBe(true)
    expect(getRowCheckbox(SUMMER_SALE)).toBeChecked()
    expect(getRowCheckbox(WINTER_SALE)).not.toBeChecked()
  })

  it('reports the whole set as selected or deselected from its checkbox', async () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>()
    const {rerender} = await render(
      <SetHarness
        selectedIds={new Set([SUMMER_SALE.id])}
        selectionState="indeterminate"
        onCheckedChange={onCheckedChange}
      />,
    )

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await userEvent.click(page.elementLocator(getSetCheckbox()!))
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)

    await rerender(
      <SetHarness
        selectedIds={new Set(VARIANTS.map(({id}) => id))}
        selectionState="checked"
        onCheckedChange={onCheckedChange}
      />,
    )

    await expect.poll(() => getSetCheckbox()?.checked).toBe(true)
    await userEvent.click(page.elementLocator(getSetCheckbox()!))
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
  })

  it('locks the set checkbox while the selection is frozen', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <SetHarness selectedIds={new Set([SUMMER_SALE.id])} selectionState="indeterminate" locked />,
    )

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await settleChromaticEndState()

    expect(isShown(getSetCheckbox()!)).toBe(true)
    expect(getSetCheckbox()).toBeDisabled()
  })

  it('hides the Editing and Served badges by default, for the Open Beta', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <SetHarness
        editingId={SUMMER_SALE.id}
        servedVersion={{id: WINTER_SALE.id, status: 'secondary'}}
      />,
    )

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await settleChromaticEndState()

    expect(getSet().querySelector('[data-badge]')).toBeNull()
    expect(getRow(SUMMER_SALE).textContent).not.toContain('Editing')
    expect(getRow(WINTER_SALE).textContent).not.toContain('Served')
    // Without the badge, the row carries no description of it either
    expect(getRow(WINTER_SALE).querySelector('.primary-action')).not.toHaveAttribute(
      'aria-describedby',
    )
  })

  it('badges the served version alongside the version being edited', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <SetHarness
        editingId={SUMMER_SALE.id}
        servedVersion={{id: SUMMER_SALE.id, status: 'primary'}}
        showStatusBadges
      />,
    )

    await expect.element(page.getByText('Served', {exact: true})).toBeVisible()
    await settleChromaticEndState()

    expect(getRow(SUMMER_SALE).dataset.served).toBe('primary')
    expect(getRow(SUMMER_SALE).textContent).toContain('Editing')
    expect(getRow(WINTER_SALE).dataset.served).toBeUndefined()
    expect(getRow(WINTER_SALE).textContent).not.toContain('Served')
  })

  it('badges the base version served instead when the selected variant is missing', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <SetHarness
        editingId={SUMMER_SALE.id}
        servedVersion={{id: WINTER_SALE.id, status: 'secondary'}}
        showStatusBadges
      />,
    )

    await expect.element(page.getByText('Served instead', {exact: true})).toBeVisible()
    await settleChromaticEndState()

    expect(getRow(WINTER_SALE).dataset.served).toBe('secondary')
    expect(getRow(WINTER_SALE).textContent).not.toContain('Editing')
    expect(getRow(SUMMER_SALE).dataset.served).toBeUndefined()
    expect(getRow(SUMMER_SALE).textContent).not.toContain('Served')
  })

  it('renders no set checkbox in read-only mode, where versions cannot be selected', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<SetHarness readOnly />)

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await userEvent.hover(page.getByText(SET_NAME))

    expect(getSetCheckbox()).toBeNull()
    expect(isShown(getSetIcon())).toBe(true)
    expect(getComputedStyle(getSetIcon()).position).toBe('static')
    // With no checkbox column, the icon column starts at the set's padding.
    expect(
      Math.round(getSetIcon().getBoundingClientRect().left - getSet().getBoundingClientRect().left),
    ).toBe(12)

    await settleChromaticEndState()
  })
  it('counts the versions in the set header', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<SetHarness count={VARIANTS.length} />)

    await expect.element(page.getByTestId('variant-set-count')).toHaveTextContent('2')
    await settleChromaticEndState()
  })

  it('says when a release version goes out', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<SetHarness />)

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await settleChromaticEndState()

    expect(getSecondaryLine(getRow(SUMMER_SALE)).textContent).toBe('As soon as possible')
  })

  it('renders no status track, and still renders a row whose release document is not found', async () => {
    const {settleChromaticEndState} = testHelpers()
    // Neither the variant nor the release list carries the release document.
    const withoutRelease = {...SUMMER_SALE, releaseDocument: undefined}
    void render(<SetHarness releases={new Map()} variants={[withoutRelease]} />)

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await settleChromaticEndState()

    expect(getRow(SUMMER_SALE).querySelector('[data-testid="version-status"]')).toBeNull()
    expect(getSecondaryLine(getRow(SUMMER_SALE)).textContent).toMatch(/^Edited /)
  })

  it('says when a version outside a release was edited or published', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<UnreleasedHarness />)

    await expect.element(page.getByText('Unreleased')).toBeVisible()
    await settleChromaticEndState()

    const draftRow = document.querySelector<HTMLElement>('[data-variant-name="Draft"]')!
    const publishedRow = document.querySelector<HTMLElement>('[data-variant-name="Published"]')!

    // The document has a published version, so the draft's line says nothing more than when
    expect(getSecondaryLine(draftRow).textContent).toMatch(/^Edited [^·]*$/)
    expect(getSecondaryLine(publishedRow).textContent).toMatch(/^Published /)
  })

  it('says a draft that was never published is not published yet', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<UnreleasedHarness versions={[DRAFT]} />)

    await expect.element(page.getByText('Unreleased')).toBeVisible()
    await settleChromaticEndState()

    expect(getSecondaryLine(getRow(DRAFT, 'Unreleased')).textContent).toMatch(
      /^Edited .* · not published yet$/,
    )
  })

  it('leads a variant row with the variant diamond, and leaves a Default row empty at the same width', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<UnreleasedHarness versions={[DRAFT, VARIANT_DRAFT, PUBLISHED]} />)

    await expect.element(page.getByText('Unreleased')).toBeVisible()
    await settleChromaticEndState()

    const variantMark = getRow(VARIANT_DRAFT, 'Unreleased').querySelector<HTMLElement>(
      '.variant-mark',
    )!
    const defaultMark = getRow(DRAFT, 'Unreleased').querySelector<HTMLElement>('.variant-mark')!

    expect(variantMark.querySelector('[data-ui="VariantMark"]')).not.toBeNull()
    expect(defaultMark.querySelector('svg')).toBeNull()
    // Reserved, so the names line up
    expect(defaultMark.getBoundingClientRect().width).toBe(
      variantMark.getBoundingClientRect().width,
    )
    // The shared leading column, the width of the navbar menus' leading column
    expect(defaultMark.getBoundingClientRect().width).toBe(21)
    // The column spans the row, and the diamond is centred on the whole row
    const text = variantMark.parentElement!.getBoundingClientRect()
    const diamond = variantMark.querySelector('svg')!.getBoundingClientRect()
    expect(Math.abs(diamond.top + diamond.height / 2 - (text.top + text.height / 2))).toBeLessThan(
      1,
    )
  })
})

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
 * Renders a set the way the inventory's `Select` does: each version row leads
 * with a checkbox, and every checkbox is revealed once anything is selected.
 */
function SetHarness({
  selectedIds = NOTHING_SELECTED,
  checked = false,
  onCheckedChange = NOOP,
  onPrimaryAction = NOOP,
  onToggle = NOOP,
  readOnly,
  locked,
  editingId,
  servedVersion,
  count,
}: {
  count?: number
  editingId?: string
  servedVersion?: ServedVersion
  selectedIds?: ReadonlySet<string>
  checked?: boolean
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
        selectedIds={selectedIds}
        checked={checked}
        onCheckedChange={onCheckedChange}
        readOnly={readOnly}
        locked={locked}
      >
        {VARIANTS.map((entry) => (
          <DocumentGroupEntry
            key={entry.id}
            variant={entry}
            releases={RELEASES}
            isSelected={entry.id === editingId}
            servedStatus={servedVersion?.id === entry.id ? servedVersion.status : undefined}
            onPrimaryAction={() => onPrimaryAction(entry)}
            leading={
              readOnly ? undefined : (
                <VariantCheckbox
                  data-visible={selectedIds.size !== 0}
                  checked={selectedIds.has(entry.id)}
                  readOnly={locked}
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

/** A set of the draft and published versions, outside any release. */
function UnreleasedHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <DocumentGroupSet
        name="Unreleased"
        selectedIds={NOTHING_SELECTED}
        checked={false}
        onCheckedChange={NOOP}
        readOnly
      >
        {[DRAFT, PUBLISHED].map((entry) => (
          <DocumentGroupEntry
            key={entry.id}
            variant={entry}
            releases={RELEASES}
            documentVersions={[DRAFT.document, PUBLISHED.document]}
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

function getStatusKinds(row: HTMLElement): (string | undefined)[] {
  const status = row.querySelector<HTMLElement>('[data-testid="version-status"]')

  if (!status) {
    throw new Error('Expected the row to render a status track')
  }

  return [...status.children].map((icon) => (icon as HTMLElement).dataset.status)
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

function getRow(entry: Variant): HTMLElement {
  const row = getSet().querySelector<HTMLElement>(`[data-variant-name="${entry.name}"]`)

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
  it('shows the set icon instead of the checkboxes while nothing is selected', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<SetHarness />)

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await settleChromaticEndState()

    expect(isShown(getSetIcon())).toBe(true)
    expect(isShown(getSetCheckbox()!)).toBe(false)
    expect(VARIANTS.some((entry) => isShown(getRowCheckbox(entry)))).toBe(false)
    // The icon overlays the checkbox's spot, so revealing the checkbox swaps one for the other.
    expect(getComputedStyle(getSetIcon()).position).toBe('absolute')
  })

  it('reveals the set checkbox in place of the set icon while the set heading is hovered', async () => {
    void render(<SetHarness />)

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await userEvent.hover(page.getByText(SET_NAME))

    await expect.poll(() => isShown(getSetCheckbox()!)).toBe(true)
    expect(isShown(getSetIcon())).toBe(false)
  })

  it('reveals a version checkbox while focus is within its row, so it can be reached by keyboard', async () => {
    void render(<SetHarness />)

    const $summerSale = page.getByRole('button', {name: SUMMER_SALE.name})
    await expect.element($summerSale).toBeInTheDocument()

    // The hidden checkboxes are out of the tab order, so the first stop is the
    // row's primary action. Focus within the row reveals its checkbox, which
    // then precedes the primary action in the tab order.
    await userEvent.tab()
    await expect.element($summerSale).toHaveFocus()
    await expect.poll(() => isShown(getRowCheckbox(SUMMER_SALE))).toBe(true)
    expect(isShown(getRowCheckbox(WINTER_SALE))).toBe(false)

    await userEvent.tab({shift: true})
    expect(document.activeElement).toBe(getRowCheckbox(SUMMER_SALE))
    expect(isShown(getRowCheckbox(SUMMER_SALE))).toBe(true)
  })

  it('toggles a revealed version checkbox with the pointer instead of activating its row', async () => {
    const {settleChromaticEndState} = testHelpers()
    const onPrimaryAction = vi.fn<(entry: Variant) => void>()
    const onToggle = vi.fn<(entry: Variant) => void>()
    void render(<SetHarness onPrimaryAction={onPrimaryAction} onToggle={onToggle} />)

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await userEvent.hover(page.elementLocator(getRow(SUMMER_SALE)))
    await expect.poll(() => isShown(getRowCheckbox(SUMMER_SALE))).toBe(true)

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

  it('reveals every checkbox once anything is selected', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<SetHarness selectedIds={new Set([SUMMER_SALE.id])} />)

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await settleChromaticEndState()

    expect(isShown(getSetCheckbox()!)).toBe(true)
    expect(isShown(getSetIcon())).toBe(false)
    expect(VARIANTS.every((entry) => isShown(getRowCheckbox(entry)))).toBe(true)
    expect(getSetCheckbox()).not.toBeChecked()
    expect(getRowCheckbox(SUMMER_SALE)).toBeChecked()
  })

  it('reports the whole set as selected or deselected from its checkbox', async () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>()
    const {rerender} = await render(
      <SetHarness selectedIds={new Set([SUMMER_SALE.id])} onCheckedChange={onCheckedChange} />,
    )

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await userEvent.click(page.elementLocator(getSetCheckbox()!))
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)

    await rerender(
      <SetHarness
        selectedIds={new Set(VARIANTS.map(({id}) => id))}
        checked
        onCheckedChange={onCheckedChange}
      />,
    )

    await expect.poll(() => getSetCheckbox()?.checked).toBe(true)
    await userEvent.click(page.elementLocator(getSetCheckbox()!))
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
  })

  it('locks the set checkbox while the selection is frozen', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<SetHarness selectedIds={new Set([SUMMER_SALE.id])} locked />)

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await settleChromaticEndState()

    expect(isShown(getSetCheckbox()!)).toBe(true)
    expect(getSetCheckbox()).toBeDisabled()
  })

  it('badges the served version alongside the version being edited', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <SetHarness
        editingId={SUMMER_SALE.id}
        servedVersion={{id: SUMMER_SALE.id, status: 'primary'}}
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
    // With no checkbox to overlay, the icon takes up its own space.
    expect(getComputedStyle(getSetIcon()).position).toBe('static')

    await settleChromaticEndState()
  })
  it('counts the versions in the set header', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<SetHarness count={VARIANTS.length} />)

    await expect.element(page.getByTestId('variant-set-count')).toHaveTextContent('2')
    await settleChromaticEndState()
  })

  it('says when a release version goes out, and marks it with its release', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<SetHarness />)

    await expect.element(page.getByText(SET_NAME)).toBeVisible()
    await settleChromaticEndState()

    expect(getSecondaryLine(getRow(SUMMER_SALE)).textContent).toBe('As soon as possible')
    // The release icon carries no draft or published status of its own.
    expect(getStatusKinds(getRow(SUMMER_SALE))).toEqual([undefined])
  })

  it('says when a version outside a release was edited or published, and marks a changed draft', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<UnreleasedHarness />)

    await expect.element(page.getByText('Unreleased')).toBeVisible()
    await settleChromaticEndState()

    const draftRow = document.querySelector<HTMLElement>('[data-variant-name="Draft"]')!
    const publishedRow = document.querySelector<HTMLElement>('[data-variant-name="Published"]')!

    expect(getSecondaryLine(draftRow).textContent).toMatch(/^Edited /)
    expect(getSecondaryLine(publishedRow).textContent).toMatch(/^Published /)
    expect(getStatusKinds(draftRow)).toEqual(['draft', 'published'])
    expect(getStatusKinds(publishedRow)).toEqual(['published'])
  })
})

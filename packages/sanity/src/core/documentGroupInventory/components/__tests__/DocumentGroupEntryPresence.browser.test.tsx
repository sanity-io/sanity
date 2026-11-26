import {type ReleaseDocument} from '@sanity/client'
import {defineField, defineType, type User} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {type Variant} from '../../machines/selectionMachine'
import {type VersionPresence} from '../../utils/groupPresenceByVersion'
import {Container} from '../Container'
import {DocumentGroupEntry} from '../DocumentGroupEntry'
import {DocumentGroupSet} from '../DocumentGroupSet'
import {VariantCheckbox} from '../VariantSet/VariantCheckbox'
import {PRESENCE_COLUMN_WIDTH} from '../VariantSet/VariantSet'

const PUBLISHED_ID = 'presence-document'
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

function stub(id: string, variantRef?: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _type: DOCUMENT_TYPE,
    _system: {
      group: {_ref: PUBLISHED_ID, _weak: true},
      bundleId: 'drafts',
      ...(variantRef ? {variants: [{_key: variantRef, _ref: variantRef}]} : {}),
    },
  }
}

function person(id: string, displayName: string): VersionPresence[number] {
  const user: User = {id, displayName}
  return {user, lastActiveAt: '2026-11-17T10:00:00.000Z'}
}

const PAT = person('pat', 'Pat Hale')
const MAX = person('max', 'Max Berg')
const KIM = person('kim', 'Kim Lund')
const LEE = person('lee', 'Lee Moss')

/** Rows of the Draft group: Default and three variants. */
const ROWS: {variant: Variant; presence: VersionPresence; isSelected?: boolean}[] = [
  {
    variant: {
      id: `drafts.${PUBLISHED_ID}`,
      name: 'Default',
      document: stub(`drafts.${PUBLISHED_ID}`),
    },
    presence: [PAT],
    isSelected: true,
  },
  {
    variant: {
      id: `versions.sGermany.${PUBLISHED_ID}`,
      name: 'Germany',
      document: stub(`versions.sGermany.${PUBLISHED_ID}`, '_.variants.germany'),
    },
    presence: [MAX],
  },
  {
    variant: {
      id: `versions.sMembers.${PUBLISHED_ID}`,
      name: 'Members',
      document: stub(`versions.sMembers.${PUBLISHED_ID}`, '_.variants.members'),
    },
    presence: [],
  },
  {
    variant: {
      id: `versions.sNordics.${PUBLISHED_ID}`,
      name: 'Nordics',
      document: stub(`versions.sNordics.${PUBLISHED_ID}`, '_.variants.nordics'),
    },
    presence: [PAT, MAX, KIM, LEE],
  },
]

function PresencePanel({width}: {width: number}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <div style={{display: 'flex', flexDirection: 'column', width, height: 400}}>
        <Container>
          <DocumentGroupSet name="Draft" selectionState="unchecked" onCheckedChange={NOOP}>
            {ROWS.map(({variant, presence, isSelected}) => (
              <DocumentGroupEntry
                key={variant.id}
                variant={variant}
                releases={RELEASES}
                isSelected={isSelected}
                presence={presence}
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

function getRow(name: string): HTMLElement {
  const row = document.querySelector<HTMLElement>(`[data-variant-name="${name}"]`)
  if (!row) throw new Error(`Expected the "${name}" row to have rendered`)
  return row
}

function cell(row: HTMLElement, selector: string): DOMRect {
  const element = row.querySelector<HTMLElement>(selector)
  if (!element) throw new Error(`Expected the row to render "${selector}"`)
  return element.getBoundingClientRect()
}

function centreX(rect: DOMRect): number {
  return rect.left + rect.width / 2
}

/** The avatars of a row's stack, in the order they paint, left to right. */
function avatarRects(row: HTMLElement): DOMRect[] {
  return [...row.querySelectorAll<HTMLElement>('.version-presence [data-ui="Avatar"]')].map(
    (avatar) => avatar.getBoundingClientRect(),
  )
}

describe('DocumentGroupEntry presence', () => {
  it('puts the avatars in one fixed column just before the mark column', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<PresencePanel width={360} />)

    await expect.element(page.getByText('Draft', {exact: true})).toBeVisible()
    await expect
      .poll(() => avatarRects(getRow('Nordics')).length, {timeout: 5_000})
      .toBeGreaterThan(0)
    await settleChromaticEndState()

    const rows = ROWS.map(({variant}) => getRow(variant.name))
    const columns = rows.map((row) => cell(row, '.version-presence'))
    const marks = rows.map((row) => cell(row, '.variant-mark'))

    // Every row has the column, at the same place and width, with or without people
    for (const column of columns) {
      expect(Math.round(column.width)).toBe(PRESENCE_COLUMN_WIDTH)
      expect(Math.abs(column.left - columns[0].left)).toBeLessThanOrEqual(0.5)
      // Right before the mark column, with or without a diamond on the row
      expect(Math.abs(column.right - marks[0].left)).toBeLessThanOrEqual(0.5)
    }

    // The mark column keeps one centre line, and so does the group header's mark
    const headerMark = document
      .querySelector<HTMLElement>('header .variant-set-icon')!
      .getBoundingClientRect()
    for (const mark of marks) {
      expect(Math.abs(centreX(mark) - centreX(headerMark))).toBeLessThanOrEqual(0.5)
    }

    // A lone avatar sits on the same centre line on the Default row (no diamond) and on a variant
    // row (with one), and it is centred on its row
    const [defaultAvatar] = avatarRects(rows[0])
    const [germanyAvatar] = avatarRects(rows[1])
    expect(Math.abs(centreX(defaultAvatar) - centreX(germanyAvatar))).toBeLessThanOrEqual(0.5)
    for (const [index, avatar] of [defaultAvatar, germanyAvatar].entries()) {
      const row = rows[index].getBoundingClientRect()
      expect(
        Math.abs(avatar.top + avatar.height / 2 - (row.top + row.height / 2)),
      ).toBeLessThanOrEqual(1)
    }

    // The row nobody has open keeps the cell, empty
    expect(rows[2].querySelector('[data-testid="version-presence"]')).toBeNull()
    expect(rows[2].querySelector('.version-presence')!.childElementCount).toBe(0)

    // Four people: one avatar and the count of the rest, inside the column
    const nordics = rows[3]
    expect(avatarRects(nordics)).toHaveLength(1)
    const counter = nordics.querySelector<HTMLElement>('[data-ui="AvatarCounter"]')!
    expect(counter.textContent).toBe('3')
    expect(counter.getBoundingClientRect().left).toBeGreaterThanOrEqual(columns[3].left - 0.5)
    // The last avatar of every stack shares the lone avatars' centre line
    const [nordicsAvatar] = avatarRects(nordics)
    expect(Math.abs(centreX(nordicsAvatar) - centreX(defaultAvatar))).toBeLessThanOrEqual(0.5)
  })

  it('names the people on the stack and gives the avatars no native tooltip', async () => {
    void render(<PresencePanel width={360} />)

    await expect.element(page.getByText('Draft', {exact: true})).toBeVisible()

    await expect
      .element(page.getByRole('img', {name: 'Pat Hale has this version open', exact: true}))
      .toBeInTheDocument()
    await expect
      .element(
        // Joined by the locale's list format (the test harness has no locale, so a plain list)
        page.getByRole('img', {
          name: /^Pat Hale, Max Berg, Kim Lund,? (and )?Lee Moss have this version open$/,
        }),
      )
      .toBeInTheDocument()

    await expect
      .poll(() => document.querySelectorAll('.version-presence [data-ui="Avatar"]').length, {
        timeout: 5_000,
      })
      .toBeGreaterThan(0)
    expect(document.querySelectorAll('.version-presence [title]')).toHaveLength(0)
  })
})

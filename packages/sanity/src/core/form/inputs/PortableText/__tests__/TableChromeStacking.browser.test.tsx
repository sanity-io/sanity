import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {page, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {studioLocaleStrings} from '../../../../i18n/bundles/studio'

const COLUMN_HANDLE_LABEL = studioLocaleStrings['inputs.portable-text.table.column-handle']
const DELETE_COLUMN_LABEL = studioLocaleStrings['inputs.portable-text.table.delete-column']

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'body',
        of: [
          defineArrayMember({type: 'block'}),
          defineArrayMember({
            type: 'object',
            name: 'table',
            fields: [
              defineField({type: 'number', name: 'headerRows'}),
              defineField({
                type: 'array',
                name: 'rows',
                of: [
                  defineArrayMember({
                    type: 'object',
                    name: 'row',
                    fields: [
                      defineField({
                        type: 'array',
                        name: 'cells',
                        of: [
                          defineArrayMember({
                            type: 'object',
                            name: 'cell',
                            fields: [
                              defineField({
                                type: 'array',
                                name: 'value',
                                of: [defineArrayMember({type: 'block'})],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
        components: {
          portableText: {
            plugins: (props) =>
              props.renderDefault({
                ...props,
                plugins: {
                  ...props.plugins,
                  table: {enabled: true},
                },
              }),
          },
        },
      }),
    ],
  }),
]

// Models a host dialog wrapping the editor (the field topology reporters
// hit in the wild, e.g. a document opened in a reference dialog): a
// stacking context above the chip's inline z-index (10050), at the same
// offset Studio's own `inspectorDialog` uses (20000) above its base
// layers. It wraps the whole pane tree, not just the input, because a
// real dialog wraps the editor from outside the pane machinery; wrapping
// only the input would nest it inside the pane's own z-index:1 stacking
// context, capping it there instead of comparing against the chip's
// context at the document root. The chip lands in @sanity/ui's fallback
// portal div (`div[data-portal]`, appended to `document.body`), outside
// this wrapper, so on unfixed code the wrapper's stacking context
// outranks the chip regardless of DOM order.
function TableChromeStackingHarness(props: {document?: SanityDocument}) {
  return (
    <div style={{position: 'relative', zIndex: 20000}}>
      <TestWrapper schemaTypes={SCHEMA_TYPES}>
        <TestForm document={props.document} />
      </TestWrapper>
    </div>
  )
}

const {render} = await import('vitest-browser-react')

const block = (key: string, text: string) => ({
  _type: 'block',
  _key: key,
  children: [{_type: 'span', _key: `${key}-s`, text, marks: []}],
  markDefs: [],
  style: 'normal',
})

const cell = (key: string, text: string) => ({
  _type: 'cell',
  _key: key,
  value: [block(`${key}-b`, text)],
})

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: new Date().toISOString(),
  _updatedAt: new Date().toISOString(),
  _rev: '123',
  body: [
    {
      _type: 'table',
      _key: 't0',
      headerRows: 0,
      rows: [
        {
          _type: 'row',
          _key: 'r0',
          cells: [cell('c0', 'foo'), cell('c1', 'bar')],
        },
        {
          _type: 'row',
          _key: 'r1',
          cells: [cell('c2', 'baz'), cell('c3', 'qux')],
        },
      ],
    },
  ],
}

describe('Portable Text Input - table chrome stacking', () => {
  it("hosted under a dialog layer that outranks the chrome's z-index: the column delete chip stays hit-testable and clickable", async () => {
    const {getFocusedPortableTextEditor} = testHelpers()

    void render(<TableChromeStackingHarness document={document} />)

    const $pte = await getFocusedPortableTextEditor('field-body')
    await expect.element($pte).toHaveTextContent('qux')

    // Hovering a cell in the first column primes the plugin's own hover
    // state, which is what makes the column handle interactive (it is
    // `pointer-events: none` until then).
    await userEvent.hover(page.getByText('foo'))

    const $columnHandle = page.getByRole('button', {name: COLUMN_HANDLE_LABEL}).nth(0)
    await expect.element($columnHandle).toBeVisible()
    await userEvent.click($columnHandle)

    const $deleteColumn = page.getByRole('button', {name: DELETE_COLUMN_LABEL})
    await expect.element($deleteColumn).toBeInTheDocument()

    const chipEl = $deleteColumn.element() as HTMLElement
    await expect.poll(() => describeHitTarget(chipEl)).toBe('column-delete-chip')

    await userEvent.click($deleteColumn)

    await expect.element($pte).not.toHaveTextContent('foo')
    await expect.element($pte).not.toHaveTextContent('baz')
    await expect.element($pte).toHaveTextContent('bar')
    await expect.element($pte).toHaveTextContent('qux')
  })
})

function describeHitTarget(chip: HTMLElement): string {
  const rect = chip.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const hit = window.document.elementFromPoint(cx, cy)
  if (hit && chip.contains(hit)) {
    return 'column-delete-chip'
  }
  return hit ? describeElement(hit) : 'nothing'
}

function describeElement(el: Element): string {
  const classes =
    typeof el.className === 'string' && el.className.trim().length > 0
      ? `.${el.className.trim().replace(/\s+/g, '.')}`
      : ''
  const id = el.id ? `#${el.id}` : ''
  return `${el.tagName.toLowerCase()}${id}${classes}`
}

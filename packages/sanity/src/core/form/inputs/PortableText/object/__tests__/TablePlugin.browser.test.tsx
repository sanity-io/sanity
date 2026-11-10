import {configure, takeSnapshot} from '@chromatic-com/vitest'
import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../../test/browser/TestForm'
import {isShown, testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {PortableTextTablePlugin} from '../TablePlugin'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'body',
        title: 'Body',
        of: [
          defineArrayMember({type: 'block'}),
          defineArrayMember({
            type: 'object',
            name: 'table',
            title: 'Table',
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
            // `plugins.table.enabled` would mount the same plugin through
            // `Plugins.tsx`; mounting it here keeps the studio's table render
            // (and its menu) the thing this file archives.
            plugins: (props) => (
              <>
                {props.renderDefault(props)}
                <PortableTextTablePlugin />
              </>
            ),
          },
        },
      }),
    ],
  }),
]

function cell(key: string, text: string) {
  return {
    _type: 'cell',
    _key: key,
    value: [
      {
        _type: 'block',
        _key: `${key}-b`,
        children: [{_type: 'span', _key: `${key}-s`, text, marks: []}],
        markDefs: [],
        style: 'normal',
      },
    ],
  }
}

const DOCUMENT: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: '123',
  body: [
    {
      _type: 'block',
      _key: 'b0',
      children: [{_type: 'span', _key: 'b0-s', text: 'A paragraph before the table.', marks: []}],
      markDefs: [],
      style: 'normal',
    },
    {
      _type: 'table',
      _key: 't0',
      headerRows: 1,
      rows: [
        {_type: 'row', _key: 'r0', cells: [cell('c00', 'Planet'), cell('c01', 'Moons')]},
        {_type: 'row', _key: 'r1', cells: [cell('c10', 'Mars'), cell('c11', 'Two')]},
        {_type: 'row', _key: 'r2', cells: [cell('c20', 'Jupiter'), cell('c21', 'Ninety-five')]},
      ],
    },
  ],
}

function TablePluginHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

/**
 * The table's options button sits in an anchor the plugin positions above the
 * table (outside the `<table>` element, inside its wrapper); the only other
 * menu buttons in the field are the toolbar's.
 */
function findTableMenuButton(): HTMLButtonElement | null {
  const table = window.document.querySelector('[data-testid="field-body"] table')
  let node = table?.parentElement ?? null
  while (node && !node.matches('[data-testid="field-body"]')) {
    const button = Array.from(
      node.querySelectorAll<HTMLButtonElement>('button[aria-haspopup="true"]'),
    ).find((candidate) => !candidate.closest('td'))
    if (button) return button
    node = node.parentElement
  }
  return null
}

describe('Portable Text table plugin', () => {
  it('renders a table with a header row and opens the table options menu', async () => {
    // The menu open/closed state races the automatic snapshot; archive the
    // open menu explicitly and let the end state be the closed table.
    configure({disableAutoSnapshot: true})
    const {settleChromaticEndState} = testHelpers()
    void render(<TablePluginHarness />)

    const $field = page.getByTestId('field-body')
    await expect.element($field.getByText('Ninety-five')).toBeVisible()
    await expect.element($field.getByRole('table')).toBeVisible()

    // The options anchor is revealed while the table is hovered.
    await $field.getByText('Mars').hover()
    await expect.poll(() => findTableMenuButton()).not.toBeNull()
    const menuButton = findTableMenuButton()!
    await expect.poll(() => isShown(menuButton)).toBe(true)
    await page.elementLocator(menuButton).click()

    const $menu = page.getByRole('menu')
    await expect.element($menu.getByText('Header row')).toBeVisible()
    await expect.element($menu.getByText('Select table')).toBeVisible()
    await expect.element($menu.getByText('Delete table')).toBeVisible()
    // `headerRows: 1` in the fixture is what the "Header row" switch reflects.
    await expect
      .poll(
        () => $menu.element().querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked,
      )
      .toBe(true)
    await settleChromaticEndState()
    await expect.element($menu.getByText('Header row')).toBeVisible()
    await takeSnapshot('table-options-menu-open')

    const menuElement = $menu.element()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => isShown(menuElement), {timeout: 5_000}).toBe(false)
    await settleChromaticEndState()
    await takeSnapshot('table-with-header-row')
  })
})

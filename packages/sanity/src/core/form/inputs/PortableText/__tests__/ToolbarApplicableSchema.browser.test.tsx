import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

// The root field allows the default decorators, annotations, and lists;
// the cell's block config allows only `strong`, no annotations, no
// lists. Toolbar membership stays field-stable, so the cell's narrower
// config must surface as disabled actions, not missing ones.
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
                                of: [
                                  defineArrayMember({
                                    type: 'block',
                                    styles: [{title: 'Normal', value: 'normal'}],
                                    lists: [],
                                    marks: {
                                      decorators: [{title: 'Strong', value: 'strong'}],
                                      annotations: [],
                                    },
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

function ToolbarApplicableSchemaHarness(props: {document?: SanityDocument}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={props.document} />
    </TestWrapper>
  )
}

const {render} = await import('vitest-browser-react')

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: new Date().toISOString(),
  _updatedAt: new Date().toISOString(),
  _rev: '123',
  body: [
    {
      _type: 'block',
      _key: 'b0',
      children: [{_type: 'span', _key: 's0', text: 'root text', marks: []}],
      markDefs: [],
      style: 'normal',
    },
    {
      _type: 'table',
      _key: 't0',
      headerRows: 0,
      rows: [
        {
          _type: 'row',
          _key: 'r0',
          cells: [
            {
              _type: 'cell',
              _key: 'c0',
              value: [
                {
                  _type: 'block',
                  _key: 'cb0',
                  children: [{_type: 'span', _key: 'cs0', text: 'cell text', marks: []}],
                  markDefs: [],
                  style: 'normal',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

describe('Portable Text Input - toolbar reflects the positional schema', () => {
  it('disables actions the caret position cannot honor, membership unchanged', async () => {
    const {getFocusedPortableTextEditor, waitForFocusedNodeText} = testHelpers()

    void render(<ToolbarApplicableSchemaHarness document={document} />)

    const $pte = await getFocusedPortableTextEditor('field-body')
    await expect.element($pte).toHaveTextContent('cell text')

    const clickText = async (text: string) => {
      const node = [...$pte.element().querySelectorAll('*')].find(
        (candidate) => candidate.childElementCount === 0 && candidate.textContent === text,
      )
      await userEvent.click(node as HTMLElement)
      await waitForFocusedNodeText(text)
    }

    await clickText('root text')
    // The narrow cell config removes nothing from the toolbar; at the
    // root everything the field declares is actionable.
    await expect
      .poll(() => actionState())
      .toEqual({
        'strong': 'enabled',
        'em': 'enabled',
        'code': 'enabled',
        'underline': 'enabled',
        'strike-through': 'enabled',
        'link': 'enabled',
        'bullet': 'enabled',
        'number': 'enabled',
      })

    await clickText('cell text')
    // Same buttons, same order; the ones the cell's block config doesn't
    // declare are disabled rather than gone.
    await expect
      .poll(() => actionState())
      .toEqual({
        'strong': 'enabled',
        'em': 'disabled',
        'code': 'disabled',
        'underline': 'disabled',
        'strike-through': 'disabled',
        'link': 'disabled',
        'bullet': 'disabled',
        'number': 'disabled',
      })
  })
})

/**
 * The responsive toolbar renders extra copies of each action button for
 * collapse measurement inside `aria-hidden` containers, permanently
 * disabled; only the visible copy carries the real state.
 */
function actionState(): Record<string, 'enabled' | 'disabled'> {
  const state: Record<string, 'enabled' | 'disabled'> = {}
  for (const button of window.document.querySelectorAll('[data-testid^="action-button-"]')) {
    if (button.closest('[aria-hidden="true"], [hidden], [inert]')) {
      continue
    }
    const key = button.getAttribute('data-testid')!.replace('action-button-', '')
    state[key] = button.matches('[disabled], [data-disabled="true"]') ? 'disabled' : 'enabled'
  }
  return state
}

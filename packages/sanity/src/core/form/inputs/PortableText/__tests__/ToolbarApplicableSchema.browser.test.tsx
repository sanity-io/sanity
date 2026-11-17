import {
  type ArrayOfType,
  defineArrayMember,
  defineField,
  defineType,
  type SanityDocument,
} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {page, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

/**
 * A document whose `body` field holds one root text block and one native
 * table, with the root and cell block configs supplied by the caller.
 */
function defineSchemaTypes(blocks: {root: ArrayOfType; cell: ArrayOfType}) {
  return [
    defineType({
      type: 'document',
      name: 'test',
      title: 'Test',
      fields: [
        defineField({
          type: 'array',
          name: 'body',
          of: [
            blocks.root,
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
                                defineField({type: 'array', name: 'value', of: [blocks.cell]}),
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
}

// The root field allows the default decorators, annotations, and lists;
// the cell's block config allows only `strong`, no annotations, no
// lists. Root members stay in the toolbar, so the cell's narrower config
// must surface as disabled actions, not missing ones.
const NARROWER_CELL = defineSchemaTypes({
  root: defineArrayMember({type: 'block'}),
  cell: defineArrayMember({
    type: 'block',
    styles: [{title: 'Normal', value: 'normal'}],
    lists: [],
    marks: {
      decorators: [{title: 'Strong', value: 'strong'}],
      annotations: [],
    },
  }),
})

// The mirror image: the cell declares a list, a decorator and an
// annotation the root field does not. The cell is an independent
// Portable Text schema, so those have to be actionable while the caret
// is in it.
const WIDER_CELL = defineSchemaTypes({
  root: defineArrayMember({
    type: 'block',
    styles: [{title: 'Normal', value: 'normal'}],
    lists: [{title: 'Bulleted', value: 'bullet'}],
    marks: {
      decorators: [{title: 'Strong', value: 'strong'}],
      annotations: [
        defineArrayMember({
          type: 'object',
          name: 'link',
          fields: [defineField({type: 'string', name: 'href'})],
        }),
      ],
    },
  }),
  cell: defineArrayMember({
    type: 'block',
    styles: [{title: 'Normal', value: 'normal'}],
    lists: [
      {title: 'Bulleted', value: 'bullet'},
      {title: 'Numbered', value: 'number'},
    ],
    marks: {
      decorators: [
        {title: 'Strong', value: 'strong'},
        {title: 'Emphasis', value: 'em'},
      ],
      annotations: [
        defineArrayMember({
          type: 'object',
          name: 'link',
          fields: [defineField({type: 'string', name: 'href'})],
        }),
        defineArrayMember({
          type: 'object',
          name: 'footnote',
          fields: [defineField({type: 'string', name: 'text'})],
        }),
      ],
    },
  }),
})

const {render} = await import('vitest-browser-react')

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
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
    const {clickText} = await renderToolbar(NARROWER_CELL)

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

  it('adds the actions only the caret position declares', async () => {
    const {clickAction, clickText, settleChromaticEndState, waitForDocumentState} =
      await renderToolbar(WIDER_CELL)

    await clickText('root text')
    // `em`, `footnote` and `number` belong to the cell alone: nothing out
    // here can apply them, so the root toolbar does not offer them.
    await expect
      .poll(() => actionState())
      .toEqual({
        strong: 'enabled',
        link: 'enabled',
        bullet: 'enabled',
      })

    await clickText('cell text')
    await expect
      .poll(() => actionState())
      .toEqual({
        strong: 'enabled',
        em: 'enabled',
        link: 'enabled',
        footnote: 'enabled',
        bullet: 'enabled',
        number: 'enabled',
      })

    // An enabled button that no-ops would pass the assertion above, so
    // press one of the cell's own and read the result off the value.
    await clickAction('number')
    await waitForDocumentState(
      (state) => state?.body?.[1]?.rows?.[0]?.cells?.[0]?.value?.[0]?.listItem === 'number',
    )

    // The click leaves the pointer on the button and the mutation leaves a
    // validation run in flight; both would reach the Chromatic archive.
    await settleChromaticEndState()
  })
})

/**
 * Mount the editor on `schemaTypes` and hand back the interactions the
 * assertions need.
 */
async function renderToolbar(schemaTypes: ReturnType<typeof defineSchemaTypes>) {
  const {
    findBySelector,
    getFocusedPortableTextEditor,
    settleChromaticEndState,
    waitForDocumentState,
    waitForFocusedNodeText,
  } = testHelpers()

  void render(
    <TestWrapper schemaTypes={schemaTypes}>
      <TestForm document={document} />
    </TestWrapper>,
  )

  const $pte = await getFocusedPortableTextEditor('field-body')
  await expect.element($pte).toMatchTextContent('cell text')

  const $portableTextInput = page.getByTestId('field-body')

  return {
    clickText: async (text: string) => {
      const node = [...$pte.element().querySelectorAll('*')].find(
        (candidate) => candidate.childElementCount === 0 && candidate.textContent === text,
      )
      await userEvent.click(node as HTMLElement)
      await waitForFocusedNodeText(text)
    },
    clickAction: async (key: string) => {
      const $button = await findBySelector(
        $portableTextInput,
        `button[data-testid="action-button-${key}"]:not([disabled])`,
      )
      await userEvent.click($button)
    },
    settleChromaticEndState,
    waitForDocumentState,
  }
}

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

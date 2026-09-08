import {
  defineArrayMember,
  defineField,
  defineType,
  type Path,
  type SanityDocument,
} from '@sanity/types'
import {unset} from 'sanity'
import {beforeEach, describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

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
          defineArrayMember({
            type: 'block',
            marks: {
              annotations: [
                defineArrayMember({
                  name: 'link',
                  title: 'Link',
                  type: 'reference',
                  components: {
                    input: (inputProps) => (
                      <div data-testid="annotationInput">
                        <button
                          type="button"
                          data-testid="focusSelfButton"
                          onClick={() => {
                            inputProps.onPathFocus([])
                          }}
                        >
                          Focus
                        </button>
                        <button
                          type="button"
                          data-testid="unsetSelfButton"
                          onClick={() => {
                            inputProps.onChange(unset())
                          }}
                        >
                          Unset
                        </button>
                        {inputProps.renderDefault(inputProps)}
                      </div>
                    ),
                  },
                  to: {type: 'test'},
                }),
              ],
            },
            of: [
              defineArrayMember({
                type: 'object',
                name: 'inlineObjectWithTextProperty',
                fields: [
                  defineField({
                    type: 'string',
                    name: 'text',
                    components: {
                      input: (inputProps) => (
                        <div data-testid="inlineTextInputField">
                          {inputProps.renderDefault(inputProps)}
                        </div>
                      ),
                    },
                  }),
                ],
              }),
            ],
          }),
          defineArrayMember({
            type: 'object',
            name: 'testObjectBlock',
            fields: [{type: 'string', name: 'text'}],
            components: {
              input: (inputProps) => (
                <div data-testid="objectBlockInputField">
                  {inputProps.renderDefault(inputProps)}
                </div>
              ),
            },
          }),
        ],
      }),
    ],
  }),
]

function DisableFocusAndUnsetHarness({
  focusPath,
  onPathFocus,
  document,
}: {
  focusPath?: Path
  onPathFocus?: (path: Path) => void
  document?: SanityDocument
}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={document} focusPath={focusPath} onPathFocus={onPathFocus} />
    </TestWrapper>
  )
}

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: new Date().toISOString(),
  _updatedAt: new Date().toISOString(),
  _rev: '123',
  body: [
    {
      _key: 'a',
      _type: 'block',
      children: [{_key: 'b', _type: 'span', text: 'Foo', marks: ['123']}],
      markDefs: [
        {
          _key: '123',
          _type: 'link',
          href: 'http://example.com',
        },
      ],
    },
  ],
}

describe('Portable Text Input', () => {
  beforeEach(() => {
    window.localStorage.debug = 'sanity-pte:*'
  })
  describe('onPathFocus', () => {
    it(`should not allow setting focus on the input itself`, async () => {
      void render(
        <DisableFocusAndUnsetHarness
          document={document}
          focusPath={['body', {_key: 'a'}, 'markDefs', {_key: '123'}]}
        />,
      )
      await expect.element(page.getByText('Edit Link')).toBeVisible()
      await page.getByTestId('focusSelfButton').click()
      await page.getByTestId('unsetSelfButton').click()
      await expect.element(page.getByText('Edit Link')).toBeVisible()
    })
  })
})

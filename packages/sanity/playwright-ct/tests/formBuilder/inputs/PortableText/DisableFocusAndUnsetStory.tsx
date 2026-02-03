import {type SanityDocument} from '@sanity/client'
import {defineArrayMember, defineField, defineType, type Path} from '@sanity/types'
import {unset} from 'sanity'

import {TestForm} from '../../utils/TestForm'
import {TestWrapper} from '../../utils/TestWrapper'

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

export function FocusTrackingStory({
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

export default FocusTrackingStory

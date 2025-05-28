import {defineField, defineType, type Path, type SanityDocument} from '@sanity/types'
import {VirtualizerScrollInstanceProvider, type WorkspaceOptions} from 'sanity'

import {TestForm} from '../utils/TestForm'
import {TestWrapper} from '../utils/TestWrapper'

interface GetSchemaTypesOpts {
  legacyEditing?: boolean
}

const arrayWithNestedObjectsWithArray = defineField({
  name: 'arrayWithNestedObjectsWithArray',
  type: 'array',
  title: 'Array with nested objects with array',
  of: [
    {
      type: 'object',
      name: 'firstObject',
      title: 'First object',
      fields: [
        {
          type: 'object',
          name: 'secondObject',
          title: 'Second object',
          fields: [
            {
              type: 'array',
              name: 'nestedArray',
              title: 'Nested array',
              of: [
                {
                  type: 'object',
                  name: 'nestedObject',
                  title: 'Nested object',
                  fields: [
                    {
                      type: 'string',
                      name: 'nestedString',
                      title: 'Nested string',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

const blockField = defineField({
  type: 'array',
  name: 'pte',
  title: 'PTE',
  of: [
    {type: 'block'},
    {
      type: 'object',
      name: 'myBlockObject',
      title: 'My block object',
      fields: [
        {
          type: 'array',
          name: 'myBlockObjectArray',
          title: 'My block object array',
          of: [
            {
              type: 'object',
              name: 'myBlockObjectArrayItem',
              title: 'My block object array item',
              fields: [
                {
                  type: 'string',
                  name: 'title',
                  title: 'Title',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

function getSchemaTypes(opts: GetSchemaTypesOpts) {
  const {legacyEditing} = opts

  const treeEditingEnabled = !legacyEditing

  return [
    defineType({
      type: 'document',
      name: 'test',
      title: 'Test',
      fieldsets: [
        {
          name: 'fieldset',
        },
      ],
      fields: [
        arrayWithNestedObjectsWithArray,

        defineField({
          type: 'array',
          name: 'myArrayOfObjects',
          title: 'My array of objects',
          options: {
            treeEditing: treeEditingEnabled,
          },
          of: [
            {
              type: 'object',
              name: 'myObject',
              fields: [
                {
                  type: 'string',
                  name: 'title',
                  title: 'Title',
                },
                blockField,
              ],
            },
          ],
        }),
        defineField({
          type: 'array',
          name: 'myFieldsetArray',
          title: 'My fieldset array',
          fieldset: 'fieldset',
          of: [
            {
              type: 'object',
              name: 'myObject',
              fields: [
                {
                  type: 'string',
                  name: 'title',
                  title: 'Title',
                },
                blockField,
              ],
            },
          ],
        }),
        blockField,
      ],
    }),
  ]
}

const FEATURES: WorkspaceOptions['beta'] = {
  treeArrayEditing: {
    enabled: true,
  },
}

interface TreeEditingStoryProps {
  legacyEditing?: boolean
  openPath?: Path
  value?: SanityDocument
}

export function TreeEditingStory(props: TreeEditingStoryProps): React.JSX.Element {
  const {legacyEditing, openPath, value} = props

  const types = getSchemaTypes({legacyEditing})

  return (
    <TestWrapper schemaTypes={types} betaFeatures={FEATURES}>
      <VirtualizerScrollInstanceProvider
        containerElement={{current: document.body}}
        scrollElement={document.body}
      >
        <TestForm document={value} openPath={openPath} />
      </VirtualizerScrollInstanceProvider>
    </TestWrapper>
  )
}

export default TreeEditingStory

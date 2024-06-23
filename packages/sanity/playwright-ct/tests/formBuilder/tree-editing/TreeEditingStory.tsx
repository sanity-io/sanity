import {defineField, defineType} from '@sanity/types'
import {VirtualizerScrollInstanceProvider, type WorkspaceOptions} from 'sanity'

import {TestForm} from '../utils/TestForm'
import {TestWrapper} from '../utils/TestWrapper'

interface GetSchemaTypesOpts {
  legacyEditing?: boolean
}

function getSchemaTypes(opts: GetSchemaTypesOpts) {
  const {legacyEditing} = opts

  const treeEditingEnabled = !legacyEditing

  return [
    defineType({
      type: 'document',
      name: 'test',
      title: 'Test',
      fields: [
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
              ],
            },
          ],
        }),
      ],
    }),
  ]
}

const FEATURES: WorkspaceOptions['features'] = {
  beta: {
    treeArrayEditing: {
      enabled: true,
    },
  },
}

interface TreeEditingStoryProps {
  legacyEditing?: boolean
}

export function TreeEditingStory(props: TreeEditingStoryProps): JSX.Element {
  const {legacyEditing} = props

  const types = getSchemaTypes({legacyEditing})

  return (
    <TestWrapper schemaTypes={types} features={FEATURES}>
      <VirtualizerScrollInstanceProvider
        containerElement={{current: document.body}}
        scrollElement={document.body}
      >
        <TestForm />
      </VirtualizerScrollInstanceProvider>
    </TestWrapper>
  )
}

export default TreeEditingStory

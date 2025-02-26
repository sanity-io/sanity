/* eslint-disable react/jsx-no-bind */
import {Card} from '@sanity/ui'
import {BlockEditor, defineType, type PortableTextInputProps} from 'sanity'

export const ptCustomBlockEditors = defineType({
  name: 'pt_customBlockEditors',
  title: 'BlockEditor examples',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'default',
      title: 'Default',
      type: 'array',
      of: [{type: 'block'}],
    },
    {
      name: 'hiddenToolbar',
      title: 'Hidden toolbar',
      type: 'array',
      components: {
        input: (props: PortableTextInputProps) => <BlockEditor {...props} hideToolbar />,
      },
      of: [{type: 'block'}],
    },
    {
      name: 'initialActive',
      title: 'Inactivate on mount (click required)',
      type: 'array',
      components: {
        input: (props: PortableTextInputProps) => <BlockEditor {...props} initialActive={false} />,
      },
      of: [{type: 'block'}],
    },
    {
      name: 'readOnly',
      title: 'Read only',
      type: 'array',
      components: {
        input: (props: PortableTextInputProps) => <BlockEditor {...props} readOnly />,
      },
      of: [{type: 'block'}],
    },
    {
      name: 'renderEditable',
      title: 'Custom renderEditable',
      description: 'Wrapped in card components with a custom placeholder',
      type: 'array',
      components: {
        input: (props: PortableTextInputProps) => (
          <BlockEditor
            {...props}
            renderEditable={(editableProps) => {
              return (
                <Card border padding={2} tone="critical">
                  <Card border padding={2} tone="critical">
                    {editableProps.renderDefault({
                      ...editableProps,
                      renderPlaceholder: () => (
                        <span style={{opacity: 0.25}}>Nothing to see here</span>
                      ),
                    })}
                  </Card>
                </Card>
              )
            }}
          />
        ),
      },
      of: [{type: 'block'}],
    },
  ],
})

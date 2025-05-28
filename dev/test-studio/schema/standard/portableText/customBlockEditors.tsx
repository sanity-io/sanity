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
  ],
})

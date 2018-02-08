import icon from 'react-icons/lib/fa/font'

export default {
  name: 'richText',
  type: 'document',
  title: 'Rich text',
  icon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'body',
      type: 'array',
      title: 'Content',
      of: [
        {
          title: 'Block',
          type: 'block'
        },
        {
          title: 'Image',
          type: 'image',
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption'
            }
          ]
        }
      ]
    }
  ]
}

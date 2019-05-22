import icon from 'react-icons/lib/fa/font'

export default {
  name: 'customBlockEditor',
  type: 'document',
  title: 'Custom Block Editor',
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
        {type: 'customBlock'},
        {
          name: 'author',
          title: 'Author',
          type: 'reference',
          to: {type: 'author'}
        },
        {
          name: 'test',
          title: 'Test',
          type: 'object',
          fields: [
            {
              type: 'string',
              name: 'title',
              validation: Rule =>
                Rule.required()
                  .min(10)
                  .max(80)
            }
          ]
        },
        {type: 'code'},
        {
          title: 'Image',
          type: 'image',
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
              description: 'Is required',
              options: {isHighlighted: true},
              validation: Rule => Rule.required()
            },
            {
              name: 'subtitle',
              title: 'Subtitle',
              type: 'string',
              options: {
                isHighlighted: true
              }
            },
            {
              title: 'Description',
              name: 'description',
              type: 'text',
              options: {
                isHighlighted: true
              }
            }
          ],
          preview: {
            select: {
              title: 'caption',
              subtitle: 'subtitle',
              description: 'description',
              media: 'asset'
            }
          }
        }
      ]
    }
  ]
}

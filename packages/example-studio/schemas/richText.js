import icon from 'react-icons/lib/fa/font'
import AuthorIcon from 'react-icons/lib/fa/user'
import Highlight from '../parts/blockEditor/Highlight'
import AuthorAnnotation from '../parts/blockEditor/AuthorAnnotation'
import TitleStyle from '../parts/blockEditor/TitleStyle'

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
          type: 'block',
          lists: [{type: 'Bullet', value: 'bullet'}, {type: 'Number', value: 'number'}],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Code', value: 'code'},
              {
                title: 'Highlight',
                value: 'highlight',
                blockEditor: {
                  icon: '/static/images/marker-icon.svg',
                  render: Highlight
                }
              }
            ],
            annotations: [
              {
                type: 'object',
                name: 'link',
                fields: [{name: 'href', type: 'string', title: 'Url'}]
              },
              {
                name: 'author',
                title: 'Author',
                type: 'reference',
                to: {type: 'author'},
                blockEditor: {
                  icon: AuthorIcon,
                  render: AuthorAnnotation
                }
              }
            ]
          },
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'Quote', value: 'blockquote'},
            {
              title: 'Title',
              value: 'title',
              blockEditor: {
                render: TitleStyle
              }
            }
          ]
        },
        {
          title: 'Image',
          type: 'image',
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
              options: {isHighlighted: true}
            }
          ]
        },
        {
          name: 'author',
          title: 'Author',
          type: 'reference',
          to: {type: 'author'},
          options: {inline: true}
        }
      ]
    }
  ]
}

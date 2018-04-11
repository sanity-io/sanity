import React from 'react'
import icon from 'react-icons/lib/fa/font'
import AuthorIcon from 'react-icons/lib/fa/user'
import Highlight from '../parts/blockEditor/Highlight'
import AuthorAnnotation from '../parts/blockEditor/AuthorAnnotation'
import TitleStyle from '../parts/blockEditor/TitleStyle'

const markerIcon = () => {
  return (
    <svg x="0" y="0" width="1em" height="1em" viewBox="0 0 414.065 414.064" style={{verticalAlign: 'middle'}}>
      <path
        d="M251.948,286.342c4.427,2.147,10.875,2.523,13.3-3.205c25.512-60.286,87.315-209.611,87.315-209.611
        c1.754-4.497-0.375-9.884-4.729-11.969L221.203,0.888c-4.354-2.085-9.886-0.368-12.291,3.815
        c0,0-78.389,141.583-107.955,198.096c-2.826,5.402-1.744,9.614,2.6,11.725C147.553,235.898,200.016,261.131,251.948,286.342z"
      />
      <path
        d="M92.116,228.669c-2.178-1.043-4.9-0.16-6.053,1.961l-9.941,18.298c-1.152,2.121-1.705,5.792-1.232,8.157l14.338,53.236
        c0.617,2.333,2.902,5.096,5.078,6.139l87.061,41.709c2.176,1.042,5.826,1.262,8.113,0.484l47.146-15.723
        c2.231-0.914,4.822-3.482,5.752-5.711l11.041-26.416c0.93-2.229-0.09-4.9-2.267-5.943L92.116,228.669z"
      />
      <path
        d="M91.174,344.753c2.021-4.221,7.127-6.019,11.346-3.996l53.65,25.701c4.219,2.021,5.752,6.986,3.406,11.035
        l-16.924,29.211c-2.346,4.049-8.092,7.36-12.771,7.36H66.473c-4.678,0-6.852-3.452-4.83-7.672L91.174,344.753z"
      />
    </svg>
  )
}

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
                  icon: markerIcon,
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

import VideoEmbedPreview, {SUPPORTED_SERVICES} from '../components/VideoEmbedPreview/VideoEmbedPreview'
import humanizeList from 'humanize-list'

export const blocksTest = {
  name: 'blocksTest',
  title: 'Blocks test',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'defaults',
      title: 'Content',
      type: 'array',
      of: [
        {type: 'image', title: 'Image'},
        {type: 'reference', to: {type: 'author'}, title: 'Reference to author'},
        {type: 'author', title: 'Embedded author'},
        {type: 'code', title: 'Code'},
        {type: 'block'},
        {
          type: 'object',
          name: 'video',
          title: 'Video',
          preview: {
            select: {
              url: 'url'
            },
            component: VideoEmbedPreview
          },
          fields: [
            {
              name: 'url',
              type: 'string',
              title: 'Video url',
              description: `Enter URL or embed code of any ${humanizeList(SUPPORTED_SERVICES.map(s => s.title), {conjunction: 'or'})} video`
            }
          ]
        }
      ]
    },
    {
      name: 'minimal',
      title: 'Reset all options',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [],
          lists: [],
          span: {
            marks: [],
            fields: []
          }
        }
      ]
    },
    {
      name: 'customized',
      title: 'Customized with block types',
      type: 'array',
      of: [
          {type: 'image', title: 'Image'},
          {type: 'author', title: 'Author'},
        {
          type: 'block',
          styles: [
              {title: 'Normal', value: 'normal'},
              {title: 'H1', value: 'h1'},
              {title: 'H2', value: 'h2'},
              {title: 'Quote', value: 'blockquote'}
          ],
          lists: [
              {title: 'Bullet', value: 'bullet'},
              {title: 'Numbered', value: 'number'}
          ],
          span: {
            marks: [
                {title: 'Strong', value: 'strong'},
                {title: 'Emphasis', value: 'em'}
            ],
            fields: [
                {name: 'Author', title: 'Author', type: 'reference', to: {type: 'author'}}
            ]
          }
        }
      ]
    },
    {
      name: 'deep',
      title: 'Blocks deep down',
      type: 'object',
      fields: [
          {name: 'something', title: 'Something', type: 'string'},
        {
          name: 'blocks',
          type: 'array',
          title: 'Blocks',
          of: [
              {type: 'image', title: 'Image'},
              {type: 'author', title: 'Author'},
            {
              type: 'block',
              styles: [
                  {title: 'Normal', value: 'normal'},
                  {title: 'H1', value: 'h1'},
                  {title: 'H2', value: 'h2'},
                  {title: 'Quote', value: 'blockquote'}
              ],
              lists: [
                  {title: 'Bullet', value: 'bullet'},
                  {title: 'Numbered', value: 'number'}
              ],
              span: {
                marks: [
                    {title: 'Strong', value: 'strong'},
                    {title: 'Emphasis', value: 'em'}
                ],
                fields: [
                    {name: 'Author', title: 'Author', type: 'reference', to: {type: 'author'}}
                ]
              }
            }
          ]
        }
      ]
    },
  ]
}

export const typeWithBlocks = {
  name: 'typeWithBlocks',
  title: 'Yo Dawg',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'someBlocks',
      type: 'object',
      fields: [
        {
          name: 'blocks',
          type: 'array',
          title: 'Blocks',
          of: [
            {
              type: 'block',
              styles: [],
              lists: [],
              span: {}
            },
            {
              type: 'typeWithBlocks',
              title: 'Type with blocks!'
            }
          ]
        }
      ]
    }
  ]
}

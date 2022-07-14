import internalLink from './internalLink'
import link from './link'

export default {
  title: 'Simple Block Content',
  name: 'simpleBlockContent',
  type: 'array',
  of: [
    {
      title: 'Block',
      type: 'block',
      styles: [],
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Italic', value: 'italic'},
        ],
        annotations: [link, internalLink],
      },
    },
  ],
}

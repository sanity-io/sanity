export default {
  title: 'Plot summaries',
  name: 'plotSummaries',
  type: 'object',
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string'
    },
    {
      name: 'summaries',
      title: 'Summaries',
      type: 'array',
      of: [
        {
          name: 'plotSummary',
          title: 'Plot Summary',
          type: 'object',
          fields: [
            {
              title: 'Summary',
              name: 'summary',
              type: 'text'
            },
            {
              title: 'Author',
              name: 'author',
              type: 'string'
            },
            {
              title: 'Link to author',
              name: 'url',
              type: 'url'
            }
          ]
        }
      ]
    }
  ]
}

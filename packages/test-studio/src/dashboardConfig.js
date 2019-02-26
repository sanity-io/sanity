export default {
  widgets: [
    {name: 'sanity-tutorials', layout: {width: 'full'}},
    {name: 'document-list'},
    {name: 'document-list', options: {title: 'Last edited', order: '_updatedAt desc'}},
    {name: 'document-list', options: {title: 'Last created books', types: ['book']}},
    {name: 'document-list', options: {title: 'Last created authors', types: ['author']}},
    {name: 'document-count'},
    {name: 'project-users'},
    {
      name: 'project-info',
      layout: {
        width: 'medium'
      },
      options: {
        data: [
          {title: 'Frontend', value: 'https://asdf.heroku.com/greedy-goblin', category: 'apps'},
          {title: 'Strange endpoint', value: 'https://example.com/v1/strange', category: 'apis'},
          {title: 'With strawberry jam?', value: 'Yes', category: 'Waffles'}
        ]
      }
    },
    // {name: 'cats', options: {imageWidth: 90}},
    {name: 'stack-overview', layout: {width: 'full'}}
  ]
}

export default {
  widgets: [
    {name: 'sanity-tutorials', layout: {width: 'full', height: 'auto'}},
    {name: 'project-users'},
    {name: 'project-users'},
    {name: 'document-list'},
    {name: 'document-list', layout: {height: 'auto'}, options: {title: 'Last edited', order: '_updatedAt desc'}},
    {name: 'document-list', layout: {height: 'auto'}, options: {title: 'Last created books', types: ['book']}},
    {
      name: 'project-info',
      layout: {
        width: 'medium',
        height: 'auto'
      },
      options: {
        data: [
          {title: 'Frontend', value: 'https://asdf.heroku.com/greedy-goblin', category: 'apps'},
          {title: 'Strange endpoint', value: 'https://example.com/v1/strange', category: 'apis'},
          {title: 'With strawberry jam?', value: 'Yes', category: 'Waffles'},
          {title: 'Gummy bears?', value: 'nope', category: 'Cheweies'},
          {title: 'With rømme?', value: 'maybe', category: 'Waffles'}
        ]
      }
    },
    {name: 'project-users'},
    {name: 'project-users'},
    {name: 'project-users'}
  ]
}

export default {
  widgets: [
    {name: 'stack-overview', layout: {width: 'full'}},
    {name: 'document-count'},
    {name: 'cats', layout: {width: 'medium'}, options: {imageWidth: 50}},
    {name: 'cats', layout: {width: 'medium'}, options: {imageWidth: 150}},
    {
      name: 'project-info',
      options: {
        data: [
          {title: 'Frontend', value: 'https://asdf.heroku.com/greedy-goblin', category: 'apps'},
          {title: 'Strange endpoint', value: 'https://example.com/v1/strange', category: 'apis'},
          {title: 'With strawberry jam?', value: 'Yes', category: 'Waffles'}
        ]
      }
    },
    {name: 'cats', options: {imageWidth: 90}}
  ]
}

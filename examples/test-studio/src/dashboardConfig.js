export default {
  widgets: [
    {
      type: '__experimental_group',
      widgets: [
        {name: 'dummy', options: {children: 'A'}},
        {name: 'dummy', options: {children: 'B'}},
        {name: 'dummy', options: {children: 'C'}},
        {name: 'dummy', options: {children: 'D'}},
      ],
    },
    {
      name: 'sanity-tutorials',
      layout: {
        width: 'full',
      },
    },
    {name: 'document-list'},
    {name: 'document-list', options: {title: 'Last edited', order: '_updatedAt desc'}},
    {name: 'document-list', options: {title: 'Last created books', types: ['book']}},
    {name: 'project-users'},
    {name: 'widget-which-does-not-exist'},
    {
      name: 'project-info',
      layout: {
        width: 'medium',
        height: 'auto',
      },
      options: {
        // eslint-disable-next-line camelcase
        __experimental_before: [{name: 'dummy'}],
        data: [
          {title: 'Frontend', value: 'https://asdf.heroku.com/greedy-goblin', category: 'apps'},
          {title: 'Strange endpoint', value: 'https://example.com/v1/strange', category: 'apis'},
          {title: 'With strawberry jam?', value: 'Yes', category: 'Waffles'},
          {title: 'Gummy bears?', value: 'nope', category: 'Cheweies'},
          {title: 'With rømme?', value: 'maybe', category: 'Waffles'},
        ],
      },
    },
    {name: 'cats'},
    {name: 'document-list', options: {limit: 100}},
  ],
}

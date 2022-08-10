export default {
  widgets: [
    {name: 'getting-started-docs', layout: {width: 'medium'}},
    {
      name: 'new-document-list',
      layout: {
        width: 'large',
      },
      options: {
        title: 'Recent documents',
        limit: 3,
      },
    },
    {
      name: 'sanity-tutorials',
      options: {
        templateRepoId: 'sanity-io/studio-supercharged',
      },
    },
  ],
}

import {PaneNode} from './types'

export const panes: PaneNode[] = [
  {
    type: 'list',
    id: 'root',
    title: 'Content',
    items: [
      {
        id: 'authors',
        title: 'Authors',
      },
      {
        id: 'sanity.io',
        title: 'Sanity.io',
      },
    ],
  },

  {
    type: 'list',
    id: 'authors',
    title: 'Authors',
    items: [
      {
        id: 'a',
        title: 'Person A',
      },
      {
        id: 'b',
        title: 'Person B',
      },
    ],
  },

  {
    type: 'document',
    id: 'a',
  },

  {
    type: 'document',
    id: 'b',
  },

  {
    type: 'list',
    id: 'sanity.io',
    title: 'Sanity.io',
    items: [
      {
        id: 'inactive-pages',
        title: 'Inactive pages',
      },
      {
        id: 'all-pages',
        title: 'All pages',
      },
    ],
  },

  {
    type: 'list',
    id: 'inactive-pages',
    title: 'Inactive pages',
    items: [
      {
        id: 'page-1',
        title: 'Page 1',
      },
    ],
  },

  {
    type: 'list',
    id: 'all-pages',
    title: 'All pages',
    items: [
      {
        id: 'page-1',
        title: 'Page 1',
      },
      {
        id: 'page-2',
        title: 'Page 2',
      },
      {
        id: 'page-3',
        title: 'Page 3',
      },
    ],
  },

  {
    type: 'document',
    id: 'page-1',
  },

  {
    type: 'document',
    id: 'page-2',
  },

  {
    type: 'document',
    id: 'page-3',
  },
]

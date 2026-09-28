import {definePlugin} from 'sanity'
import {route} from 'sanity/router'

import {EditorTool} from './EditorTool'
import {SearchNavbar} from './SearchNavbar'

export const chromeFreeEditor = definePlugin({
  name: 'chrome-free-editor',
  studio: {
    components: {
      navbar: SearchNavbar,
    },
  },
  tools: [
    {
      name: 'editor',
      title: 'Editor',
      component: EditorTool,
      router: route.create('/', [route.create('/:type/:id')]),
      canHandleIntent: (intent) => intent === 'edit',
      getIntentState: (intent, params) =>
        intent === 'edit' ? {type: params.type, id: params.id} : null,
    },
  ],
})

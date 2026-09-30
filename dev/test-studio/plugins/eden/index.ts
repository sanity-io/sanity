import {DashboardIcon} from '@sanity/icons/Dashboard'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {definePlugin} from 'sanity'
import {route} from 'sanity/router'

import {DashboardTool} from './DashboardTool'
import {EdenNavbar} from './EdenNavbar'
import {EditorTool} from './EditorTool'
import {edenSchemaTypes} from './schema'

export const eden = definePlugin({
  name: 'eden',
  schema: {types: edenSchemaTypes},
  studio: {
    components: {
      navbar: EdenNavbar,
    },
  },
  tools: [
    {
      name: 'dashboard',
      title: 'Dashboard',
      icon: DashboardIcon,
      component: DashboardTool,
      router: route.create('/'),
    },
    {
      name: 'editor',
      title: 'Editor',
      icon: DocumentTextIcon,
      component: EditorTool,
      router: route.create('/', [route.create('/:type/:id')]),
      canHandleIntent: (intent) => intent === 'edit',
      getIntentState: (intent, params) =>
        intent === 'edit' ? {type: params.type, id: params.id} : null,
    },
  ],
})

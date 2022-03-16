import {createConfig} from '@sanity/base'
import {deskTool} from '@sanity/desk-tool'
import {initialValueTemplates} from './initialValueTemplates'
import {themePreviewTool} from './plugins/theme-preview-tool'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default createConfig({
  plugins: [
    deskTool({structure}),
    themePreviewTool(),
    // @todo
    // visionTool(),
  ],

  project: {
    name: 'Design Studio',
  },

  sources: [
    {
      name: 'default',
      title: 'Default',
      projectId: 'vr2mh9ho',
      dataset: 'production',
      initialValueTemplates,
      schemaTypes,
    },
  ],
})

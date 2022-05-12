import {createConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {templates} from './templates'
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
  name: 'default',
  title: 'Design Studio',
  projectId: 'vr2mh9ho',
  dataset: 'production',
  schema: {
    templates,
    types: schemaTypes,
  },
})

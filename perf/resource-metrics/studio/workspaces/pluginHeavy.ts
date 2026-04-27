import {visionTool} from '@sanity/vision'
import {type Config, defineField, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'

export const pluginHeavy = {
  name: 'plugin-heavy',
  title: 'Plugin Heavy',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: [
      defineType({
        name: 'simpleDoc',
        title: 'Simple Document',
        type: 'document',
        fields: [defineField({name: 'title', type: 'string'})],
      }),
    ],
  },
} satisfies Partial<Config>

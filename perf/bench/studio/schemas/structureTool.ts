import {type Config, defineField, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'

/**
 * A workspace with the structure tool and one minimal document type: the
 * structure counterpart to the emptyTool workspace, for the load scenarios
 * (the root list pane renders the type's item).
 */
export const structureToolWorkspace = {
  name: 'structure-tool-bench',
  plugins: [structureTool()],
  schema: {
    types: [
      defineType({
        name: 'page',
        type: 'document',
        fields: [defineField({name: 'title', type: 'string'})],
      }),
    ],
  },
} satisfies Partial<Config>

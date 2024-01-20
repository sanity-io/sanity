import {type CodeMod} from '../types'

const purpose = 'Transform `sanity/desk` imports to `sanity/structure`'
const description = `
Modifies all code paths that are found to import  from 'sanity/desk' to instead import from
'sanity/structure', and renames any renamed members.

from: import {deskTool} from 'sanity/desk'
  to: import {structureTool} from 'sanity/structure'

from: import {StructureBuilder} from 'sanity/desk'
  to: import {StructureBuilder} from 'sanity/structure'
`.trim()

export const deskRename: CodeMod = {
  purpose,
  description,
  filename: 'deskRename.js',
}

import {DocumentIcon} from '@sanity/icons/Document'
import {definePlugin} from 'sanity'
import {structureTool} from 'sanity/structure'

import {DocumentFormOnlyTool} from './DocumentFormOnlyTool'
import {documentFormOnlyArticle} from './schema'

const documentFormTool = {
  name: 'document-form-only',
  title: 'Document',
  icon: DocumentIcon,
  component: DocumentFormOnlyTool,
}

/**
 * The structure tool registers the document actions, badges, inspectors and locale bundle the
 * form needs. Install it for those, then replace its tool so the workspace routes straight to
 * the form.
 */
export const documentFormOnly = definePlugin({
  name: 'document-form-only',
  schema: {
    types: [documentFormOnlyArticle],
  },
  plugins: [structureTool()],
  studio: {
    components: {
      navbar: NoNavbar,
    },
  },
  tools: () => [documentFormTool],
})

function NoNavbar() {
  return null
}

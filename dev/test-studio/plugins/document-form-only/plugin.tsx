import {DocumentIcon} from '@sanity/icons/Document'
import {definePlugin, type Tool} from 'sanity'
import {route, type SearchParam} from 'sanity/router'
import {structureTool} from 'sanity/structure'

import {DocumentFormOnlyTool} from './DocumentFormOnlyTool'
import {DOCUMENT_FORM_ONLY_ID, DOCUMENT_FORM_ONLY_TYPE, documentFormOnlyArticle} from './schema'

// Pane params a comment link carries: the open inspector and the selected thread.
const PANE_INTENT_PARAMS = ['inspect', 'comment']

function toPaneSearchParams(params: Record<string, string>): SearchParam[] {
  return PANE_INTENT_PARAMS.filter((name) => typeof params[name] === 'string').map(
    (name): SearchParam => [name, params[name]],
  )
}

const documentFormTool: Tool = {
  name: 'document-form-only',
  title: 'Document',
  icon: DocumentIcon,
  component: DocumentFormOnlyTool,
  router: route.create('/'),
  canHandleIntent: (intent, params) =>
    intent === 'edit' &&
    params.id === DOCUMENT_FORM_ONLY_ID &&
    params.type === DOCUMENT_FORM_ONLY_TYPE,
  getIntentState: (_intent, params) => ({_searchParams: toPaneSearchParams(params)}),
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

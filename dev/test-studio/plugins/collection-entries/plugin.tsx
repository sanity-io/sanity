import {FolderIcon} from '@sanity/icons/Folder'
import {definePlugin, type Tool} from 'sanity'
import {route, type RouterState, type SearchParam} from 'sanity/router'
import {structureTool} from 'sanity/structure'

import {CollectionEntriesTool} from './CollectionEntriesTool'
import {ENTRY_TYPE, COLLECTION_TYPE} from './constants'
import {collectionEntry, entryCollection} from './schema'
import {StudioSdkLayout} from './StudioSdkLayout'

// Intent params forwarded to the pane, e.g. a comment link's open inspector and thread.
const PANE_INTENT_PARAMS = ['inspect', 'comment']

function isCollectionEntriesType(type: unknown) {
  return type === COLLECTION_TYPE || type === ENTRY_TYPE
}

function toPaneSearchParams(params: Record<string, string>): SearchParam[] {
  return PANE_INTENT_PARAMS.filter((name) => typeof params[name] === 'string').map(
    (name): SearchParam => [name, params[name]],
  )
}

function getEditIntentState(
  params: Record<string, string>,
  previousState: RouterState | undefined,
) {
  const _searchParams = toPaneSearchParams(params)

  if (params.type === COLLECTION_TYPE) {
    return {collectionId: params.id, _searchParams}
  }

  const collectionId = previousState?.collectionId
  return typeof collectionId === 'string'
    ? {collectionId, entryId: params.id, _searchParams}
    : {entryId: params.id, _searchParams}
}

const collectionEntriesTool: Tool = {
  name: 'collections',
  title: 'Collections',
  icon: FolderIcon,
  component: CollectionEntriesTool,
  router: route.create('/', [
    route.create('/collection/:collectionId', [route.create('/entry/:entryId')]),
    route.create('/entry/:entryId'),
  ]),
  canHandleIntent: (intent, params) => intent === 'edit' && isCollectionEntriesType(params.type),
  getIntentState: (_intent, params, previousState) => getEditIntentState(params, previousState),
}

// structureTool supplies the document actions and inspectors; the collection tool replaces its tool.
export const collectionEntries = definePlugin({
  name: 'collection-entries',
  schema: {
    types: [entryCollection, collectionEntry],
  },
  plugins: [structureTool()],
  studio: {
    components: {
      layout: StudioSdkLayout,
      navbar: NoNavbar,
    },
  },
  tools: () => [collectionEntriesTool],
})

function NoNavbar() {
  return null
}

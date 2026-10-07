import './documentFormOnly.css'

import {CommentIcon} from '@sanity/icons/Comment'
import {Button, Card, Flex} from '@sanity/ui'
import {useMemo} from 'react'
import {type SearchParam, useRouter} from 'sanity/router'
import {
  DocumentPane,
  type DocumentPaneNode,
  PaneLayout,
  PaneRouterContext,
  type PaneRouterContextValue,
  StructureToolProvider,
} from 'sanity/structure'

import {DOCUMENT_FORM_ONLY_ID, DOCUMENT_FORM_ONLY_TYPE} from './schema'

type PaneParams = Record<string, string | undefined>

// Studio's built-in comments inspector name; `sanity` exports it only as @internal.
const COMMENTS_INSPECTOR = 'sanity/comments'

// The tool navigates nowhere, so every link the document pane renders is a dead end.
function NoLink() {
  return null
}

function noop() {}

function toSearchParams(params: PaneParams): SearchParam[] {
  return Object.entries(params).flatMap(([name, value]): SearchParam[] =>
    typeof value === 'string' ? [[name, value]] : [],
  )
}

// Pane params live in the URL so an `edit` intent from a comment link can open the comments panel.
export function DocumentFormOnlyTool() {
  const {state, navigate} = useRouter()
  const searchParams = state._searchParams
  const params: PaneParams = useMemo(() => Object.fromEntries(searchParams ?? []), [searchParams])
  const isCommentsOpen = params.inspect === COMMENTS_INSPECTOR

  const paneRouter: PaneRouterContextValue = useMemo(
    () => ({
      index: 0,
      groupIndex: 0,
      siblingIndex: 0,
      payload: {},
      params,
      hasGroupSiblings: false,
      groupLength: 1,
      routerPanesState: [],
      ChildLink: NoLink,
      ReferenceChildLink: NoLink,
      ParameterizedLink: NoLink,
      handleEditReference: noop,
      replaceCurrent: noop,
      closeCurrent: noop,
      closeCurrentAndAfter: noop,
      duplicateCurrent: noop,
      setView: noop,
      setParams: (nextParams: PaneParams) =>
        navigate({_searchParams: toSearchParams(nextParams)}, {replace: true}),
      setPayload: noop,
      createPathWithParams: () => '',
      navigateIntent: noop,
    }),
    [navigate, params],
  )

  const pane: DocumentPaneNode = useMemo(
    () => ({
      id: DOCUMENT_FORM_ONLY_ID,
      type: 'document',
      title: '',
      options: {id: DOCUMENT_FORM_ONLY_ID, type: DOCUMENT_FORM_ONLY_TYPE},
    }),
    [],
  )

  function toggleComments() {
    paneRouter.setParams({...params, inspect: isCommentsOpen ? undefined : COMMENTS_INSPECTOR})
  }

  return (
    <StructureToolProvider>
      <Flex direction="column" height="fill">
        <Card borderBottom padding={2}>
          <Flex justify="flex-end">
            <Button
              icon={CommentIcon}
              mode="bleed"
              text="Comments"
              selected={isCommentsOpen}
              aria-pressed={isCommentsOpen}
              onClick={toggleComments}
            />
          </Flex>
        </Card>
        <PaneLayout className="document-form-only-tool" flex={1} style={{minHeight: 0}}>
          <PaneRouterContext.Provider value={paneRouter}>
            <DocumentPane paneKey="document" index={1} itemId="document" pane={pane} />
          </PaneRouterContext.Provider>
        </PaneLayout>
      </Flex>
    </StructureToolProvider>
  )
}

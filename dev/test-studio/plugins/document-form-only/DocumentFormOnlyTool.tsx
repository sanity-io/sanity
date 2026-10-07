import './documentFormOnly.css'

import {CommentIcon} from '@sanity/icons/Comment'
import {Button, Card, Flex} from '@sanity/ui'
import {useMemo, useState} from 'react'
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

export function DocumentFormOnlyTool() {
  const [params, setParams] = useState<PaneParams>({})
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
      setParams,
      setPayload: noop,
      createPathWithParams: () => '',
      navigateIntent: noop,
    }),
    [params],
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
    setParams({...params, inspect: isCommentsOpen ? undefined : COMMENTS_INSPECTOR})
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

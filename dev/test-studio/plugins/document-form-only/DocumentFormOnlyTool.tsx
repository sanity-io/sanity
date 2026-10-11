import './documentFormOnly.css'

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

// The tool navigates nowhere, so every link the document pane renders is a dead end.
function NoLink() {
  return null
}

function noop() {}

export function DocumentFormOnlyTool() {
  const [params, setParams] = useState<PaneParams>({})

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

  return (
    <StructureToolProvider>
      <PaneLayout className="document-form-only-tool" style={{height: '100%'}}>
        <PaneRouterContext.Provider value={paneRouter}>
          <DocumentPane paneKey="document" index={1} itemId="document" pane={pane} />
        </PaneRouterContext.Provider>
      </PaneLayout>
    </StructureToolProvider>
  )
}

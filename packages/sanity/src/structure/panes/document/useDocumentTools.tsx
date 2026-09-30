import {type ReactNode, useContext} from 'react'
import {type ResolvedDocumentTools} from 'sanity'
import {DocumentToolsContext} from 'sanity/_singletons'

/**
 * Publishes the tools resolved for this document to everything the form renders. One resolution
 * per document, so the header, the sub-header and the overflow menu cannot disagree.
 *
 * @internal
 */
export function DocumentToolsProvider(props: {tools: ResolvedDocumentTools; children: ReactNode}) {
  const {tools, children} = props

  return <DocumentToolsContext.Provider value={tools}>{children}</DocumentToolsContext.Provider>
}

/**
 * @internal
 */
export function useDocumentTools(): ResolvedDocumentTools {
  const tools = useContext(DocumentToolsContext)

  if (!tools) {
    throw new Error('useDocumentTools must be used within a DocumentToolsProvider')
  }

  return tools
}

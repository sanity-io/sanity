import {createContext} from 'sanity/_createContext'

import type {ResolvedDocumentTools} from '../../core/config/document/tools'

/**
 * The document form's tools, resolved once per document by the host that renders the form.
 *
 * @internal
 */
export const DocumentToolsContext = createContext<ResolvedDocumentTools | null>(
  'sanity/_singletons/context/document-tools',
  null,
)

import {createContext} from 'sanity/_createContext'

import type {ResolvedDocumentFeatures} from '../../core/config/document/features'

/**
 * The document form's features, resolved once per document by the host that renders the form.
 *
 * @internal
 */
export const DocumentFeaturesContext = createContext<ResolvedDocumentFeatures | null>(
  'sanity/_singletons/context/document-features',
  null,
)

import {type ReactNode, useContext} from 'react'
import {type ResolvedDocumentFeatures} from 'sanity'
import {DocumentFeaturesContext} from 'sanity/_singletons'

/**
 * Publishes the features resolved for this document to everything the form renders. One resolution
 * per document, so the header, the sub-header and the overflow menu cannot disagree.
 *
 * @internal
 */
export function DocumentFeaturesProvider(props: {
  features: ResolvedDocumentFeatures
  children: ReactNode
}) {
  const {features, children} = props

  return (
    <DocumentFeaturesContext.Provider value={features}>{children}</DocumentFeaturesContext.Provider>
  )
}

/**
 * @internal
 */
export function useDocumentFeatures(): ResolvedDocumentFeatures {
  const features = useContext(DocumentFeaturesContext)

  if (!features) {
    throw new Error('useDocumentFeatures must be used within a DocumentFeaturesProvider')
  }

  return features
}

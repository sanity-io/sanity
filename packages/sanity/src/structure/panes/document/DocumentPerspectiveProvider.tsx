import {type ReactNode, useContext, useEffect, useMemo} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getVersionFromId,
  isCardinalityOnePerspective,
  type PerspectiveContextValue,
  useDocumentVersions,
  useSetPerspective,
} from 'sanity'
import {PerspectiveContext, RawPerspectiveContext} from 'sanity/_singletons'

/**
 * Internal component that handles URL cleanup for cardinality one releases
 * when documents don't exist in the selected release.
 */
const DocumentPerspectiveResetHandler = ({documentId}: {documentId: string}) => {
  const rawContext = useContext(RawPerspectiveContext)
  const {data: documentVersions, loading: documentVersionsLoading} = useDocumentVersions({
    documentId,
  })
  const setPerspective = useSetPerspective()

  useEffect(() => {
    // Don't make decisions while document versions are still loading
    if (documentVersionsLoading || !rawContext) {
      return
    }

    // Check if we have a cardinality one release selected
    const isCardinalityOne = isCardinalityOnePerspective(rawContext.selectedPerspective)

    // Only handle cardinality one releases
    if (!isCardinalityOne) {
      return
    }

    // If document has no versions, clear the cardinality one perspective
    if (!documentVersions?.length) {
      setPerspective(undefined)
      return
    }

    const releasesIds = documentVersions.map((id) => getVersionFromId(id))
    // selectedPerspective is a release object if it's cardinality one
    const currentReleaseId =
      typeof rawContext.selectedPerspective === 'object' && '_id' in rawContext.selectedPerspective
        ? getReleaseIdFromReleaseDocumentId(rawContext.selectedPerspective._id)
        : null

    if (!currentReleaseId) return

    const documentExistsInRelease = releasesIds.includes(currentReleaseId)

    // If document doesn't exist in the cardinality one release, clear the perspective
    if (!documentExistsInRelease) {
      setPerspective(undefined)
    }
  }, [documentId, rawContext, documentVersions, documentVersionsLoading, setPerspective])

  return null
}

/**
 * @internal
 * Provides document-level perspective context that handles cardinality one releases
 * in a document-aware manner. When a document doesn't exist in a cardinality one
 * release, it provides drafts perspective and clears the URL.
 */
export function DocumentPerspectiveProvider({
  children,
  documentId,
}: {
  children: ReactNode
  documentId: string
}) {
  const rawContext = useContext(RawPerspectiveContext)
  const mappedContext = useContext(PerspectiveContext)
  const {data: documentVersions, loading: documentVersionsLoading} = useDocumentVersions({
    documentId,
  })

  const value = useMemo<PerspectiveContextValue | null>(() => {
    if (!rawContext || !mappedContext) return mappedContext

    // Check if we have a cardinality one release selected in the raw context
    const isCardinalityOne = isCardinalityOnePerspective(rawContext.selectedPerspective)

    // For non-cardinality-one releases, use the mapped context as-is
    if (!isCardinalityOne) {
      return mappedContext
    }

    // For cardinality one releases, check if document exists in the release
    // If we're still loading document versions, default to drafts
    if (documentVersionsLoading) {
      return {
        ...mappedContext,
        selectedPerspective: 'drafts',
        selectedPerspectiveName: undefined, // drafts
        selectedReleaseId: undefined, // drafts
      }
    }

    // If document has no versions, use drafts
    if (!documentVersions?.length) {
      return {
        ...mappedContext,
        selectedPerspective: 'drafts',
        selectedPerspectiveName: undefined, // drafts
        selectedReleaseId: undefined, // drafts
      }
    }

    const releasesIds = documentVersions.map((id) => getVersionFromId(id))
    // selectedPerspective is a release object if it's cardinality one
    const currentReleaseId =
      typeof rawContext.selectedPerspective === 'object' && '_id' in rawContext.selectedPerspective
        ? getReleaseIdFromReleaseDocumentId(rawContext.selectedPerspective._id)
        : null

    if (!currentReleaseId) {
      // Shouldn't happen but handle gracefully
      return mappedContext
    }

    const documentExistsInRelease = releasesIds.includes(currentReleaseId)

    // If document doesn't exist in the cardinality one release, use drafts
    if (!documentExistsInRelease) {
      return {
        ...mappedContext,
        selectedPerspective: 'drafts',
        selectedPerspectiveName: undefined, // drafts
        selectedReleaseId: undefined, // drafts
      }
    }

    // Document exists in the cardinality one release - use the raw unmapped values
    return {
      ...mappedContext,
      selectedPerspective: rawContext.selectedPerspective,
      selectedPerspectiveName: rawContext.selectedPerspectiveName,
      selectedReleaseId: rawContext.selectedReleaseId,
    }
  }, [rawContext, mappedContext, documentVersions, documentVersionsLoading])

  // If we don't have a value, just return children without wrapping
  if (!value) {
    return <>{children}</>
  }

  return (
    <PerspectiveContext.Provider value={value}>
      {children}
      <DocumentPerspectiveResetHandler documentId={documentId} />
    </PerspectiveContext.Provider>
  )
}

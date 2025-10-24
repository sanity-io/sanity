import {type ReactNode, useContext, useEffect, useMemo} from 'react'
import {
  getVersionFromId,
  isCardinalityOnePerspective,
  LATEST,
  type PerspectiveContextValue,
  PUBLISHED,
  useDocumentVersions,
  useRawPerspective,
  useSetPerspective,
  useWorkspace,
} from 'sanity'
import {PerspectiveContext} from 'sanity/_singletons'

import {usePresentationTool} from '../../../presentation/usePresentationTool'

function isDocumentInSelectedRelease(
  documentVersions: string[],
  selectedReleaseId: string,
): boolean {
  const releasesIds = documentVersions.map((id) => getVersionFromId(id))
  return releasesIds.includes(selectedReleaseId)
}

// Clears URL for cardinality one releases when document doesn't exist in selected release
const DocumentPerspectiveResetHandler = ({documentId}: {documentId: string}) => {
  const rawContext = useRawPerspective()
  const {data: documentVersions, loading: documentVersionsLoading} = useDocumentVersions({
    documentId,
  })
  const setPerspective = useSetPerspective()

  useEffect(() => {
    if (documentVersionsLoading) {
      return
    }

    if (!isCardinalityOnePerspective(rawContext.selectedPerspective)) {
      return
    }

    if (!documentVersions?.length || !rawContext.selectedReleaseId) {
      setPerspective(undefined)
      return
    }

    const documentExistsInRelease = isDocumentInSelectedRelease(
      documentVersions,
      rawContext.selectedReleaseId,
    )

    if (!documentExistsInRelease) {
      setPerspective(undefined)
    }
  }, [documentId, rawContext, documentVersions, documentVersionsLoading, setPerspective])

  return null
}

/**
 * @internal
 * Exposes cardinality one releases as selectedPerspective through PerspectiveContext
 */
export function DocumentPerspectiveProvider({
  children,
  documentId,
}: {
  children: ReactNode
  documentId: string
}) {
  const rawContext = useRawPerspective()
  const mappedContext = useContext(PerspectiveContext)
  const {data: documentVersions, loading: documentVersionsLoading} = useDocumentVersions({
    documentId,
  })
  const inPresentationTool = usePresentationTool(false) !== null

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()
  const defaultPerspective = isDraftModelEnabled ? LATEST : PUBLISHED

  const value = useMemo<PerspectiveContextValue | null>(() => {
    if (!mappedContext) return mappedContext

    if (!isCardinalityOnePerspective(rawContext.selectedPerspective)) {
      return mappedContext
    }

    // Default to drafts while loading or if no versions exist
    if (documentVersionsLoading || !documentVersions?.length || !rawContext.selectedReleaseId) {
      return {
        ...mappedContext,
        selectedPerspective: defaultPerspective,
        selectedPerspectiveName: undefined,
        selectedReleaseId: undefined,
      }
    }

    const documentExistsInRelease = isDocumentInSelectedRelease(
      documentVersions,
      rawContext.selectedReleaseId,
    )

    // use drafts if document doesn't exist in the selected cardinality one release
    if (!documentExistsInRelease) {
      return {
        ...mappedContext,
        selectedPerspective: defaultPerspective,
        selectedPerspectiveName: undefined,
        selectedReleaseId: undefined,
      }
    }

    // Use raw unmapped values when document exists in cardinality one release
    return {
      ...mappedContext,
      selectedPerspective: rawContext.selectedPerspective,
      selectedPerspectiveName: rawContext.selectedPerspectiveName,
      selectedReleaseId: rawContext.selectedReleaseId,
    }
  }, [rawContext, mappedContext, documentVersionsLoading, documentVersions, defaultPerspective])

  if (!value) {
    return <>{children}</>
  }

  return (
    <PerspectiveContext.Provider value={value}>
      {children}
      {!inPresentationTool && <DocumentPerspectiveResetHandler documentId={documentId} />}
    </PerspectiveContext.Provider>
  )
}

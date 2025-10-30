import {useEffect, useMemo} from 'react'
import {
  getVersionFromId,
  isCardinalityOnePerspective,
  useDocumentVersions,
  usePerspective,
  useSetPerspective,
} from 'sanity'
import {useEffectEvent} from 'use-effect-event'

export const useResetCardinalityOnePerspective = (documentId: string) => {
  const {selectedPerspectiveName, selectedPerspective} = usePerspective()
  const documentVersions = useDocumentVersions({documentId})
  const setPerspective = useSetPerspective()
  const hasDocumentInPerspective = useMemo(
    () => documentVersions.data.some((v) => getVersionFromId(v) === selectedPerspectiveName),
    [documentVersions.data, selectedPerspectiveName],
  )

  const resetPerspective = useEffectEvent(() => {
    // When the document which set the cardinality one perspective (aka Scheduled Draft) is unmounted
    // We need to reset the perspective to the default perspective.
    if (isCardinalityOnePerspective(selectedPerspective) && hasDocumentInPerspective) {
      setPerspective(undefined)
    }
  })
  useEffect(() => {
    return () => {
      resetPerspective()
    }
  }, [documentId])
  return null
}

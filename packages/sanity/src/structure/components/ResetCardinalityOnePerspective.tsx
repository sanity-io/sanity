import {useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {filter, map, type Observable, ReplaySubject} from 'rxjs'
import {
  getVersionFromId,
  isCardinalityOnePerspective,
  useDocumentVersions,
  usePerspective,
  useSetPerspective,
} from 'sanity'
import {useEffectEvent} from 'use-effect-event'

import {LOADING_PANE} from '../constants'
import {type DocumentPaneNode, type PaneNode} from '../types'

/**
 * @internal
 * Resets the perspective to the default perspective when a document with cardinality one perspective is unmounted.
 */
export const ResetCardinalityOnePerspective = ({documentId}: {documentId: string}) => {
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

/**
 * @returns a list of document panes node which waits until all panes are not loading before emitting a new array of DocumentPaneNodes.
 */
const useStableDocumentPanes = (resolvedPanes: (PaneNode | typeof LOADING_PANE)[]) => {
  const [resolvedPanesSubject] = useState(
    () => new ReplaySubject<(PaneNode | typeof LOADING_PANE)[]>(1),
  )

  const resolvedPanes$ = useMemo(() => resolvedPanesSubject.asObservable(), [resolvedPanesSubject])

  useEffect(() => {
    resolvedPanesSubject.next(resolvedPanes)
  }, [resolvedPanes, resolvedPanesSubject])

  const documentPanes$: Observable<DocumentPaneNode[]> = useMemo(() => {
    return resolvedPanes$.pipe(
      // If it's loading panes, wait.
      // Panes are changing from DocumentPaneNode to LoadingPaneNode when the perspective stack is updated, so we need to wait until all panes are resolved
      // before emitting a new array of DocumentPaneNodes.
      // If we don't wait, the panes will be  "unmounted" and the perspective will reset when we don't want it to.
      filter((panes) => !panes.some((pane) => pane === LOADING_PANE)),
      map((panes) =>
        panes.filter(
          (pane): pane is DocumentPaneNode => pane !== LOADING_PANE && pane.type === 'document',
        ),
      ),
    )
  }, [resolvedPanes$])

  const documentPanes = useObservable(documentPanes$, null)
  return documentPanes
}
export const StructureToolResetCardinalityOnePerspective = ({
  resolvedPanes,
}: {
  resolvedPanes: (PaneNode | typeof LOADING_PANE)[]
}) => {
  const documentPanes = useStableDocumentPanes(resolvedPanes)

  return documentPanes?.map((pane) => (
    <ResetCardinalityOnePerspective key={pane.id} documentId={pane.options.id} />
  ))
}

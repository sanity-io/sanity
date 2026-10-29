import {useContext, useMemo} from 'react'
import {usePerspective} from 'sanity'
import {PaneRouterContext} from 'sanity/structure'

export function usePresentationPerspectiveStack() {
  const {perspectiveStack} = usePerspective()
  const paneRouter = useContext(PaneRouterContext)
  if (!paneRouter) {
    throw new Error('PaneRouter not found')
  }
  const scheduledDraftPerspective = paneRouter.params?.scheduledDraft

  // Memoized so consumers can use the stack as a dependency without
  // rebuilding their streams every render.
  return useMemo(
    () =>
      scheduledDraftPerspective
        ? [scheduledDraftPerspective, ...perspectiveStack]
        : perspectiveStack,
    [scheduledDraftPerspective, perspectiveStack],
  )
}

import {useContext} from 'react'
import {usePerspective} from 'sanity'
import {PaneRouterContext} from 'sanity/structure'

export function usePresentationPerspectiveStack() {
  const {perspectiveStack} = usePerspective()
  const paneRouter = useContext(PaneRouterContext)
  if (!paneRouter) {
    throw new Error('PaneRouter not found')
  }
  const scheduledDraftPerspective = paneRouter.params?.scheduledDraft

  if (scheduledDraftPerspective) {
    return [scheduledDraftPerspective, ...perspectiveStack]
  }
  return perspectiveStack
}

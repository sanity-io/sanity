import {type ReleaseId} from '@sanity/client'
import {useMemo} from 'react'
import {useRouter} from 'sanity/router'

export interface SelectedPerspectivePropsValue {
  /** The selected perspective name, it could be a release or Published */
  selectedPerspectiveName: 'published' | ReleaseId | undefined
  /**
   * The releaseId as r<string>; it will be undefined if the selected perspective is `published` or `drafts`
   */
  selectedReleaseId: ReleaseId | undefined
}

/**
 * Gets the perspective properties that is currently selected.
 
 * @internal
 */
export function useSelectedPerspectiveProps(): SelectedPerspectivePropsValue {
  const {
    stickyParams: {perspective},
  } = useRouter()
  const selectedPerspectiveName = perspective as 'published' | ReleaseId | undefined
  const selectedReleaseId =
    selectedPerspectiveName === 'published' ? undefined : selectedPerspectiveName

  return useMemo(
    () => ({selectedPerspectiveName, selectedReleaseId}),
    [selectedPerspectiveName, selectedReleaseId],
  )
}

import {type ClientPerspective, type ReleaseId} from '@sanity/client'

import {type ReleaseDocument} from '../releases/store/types'

/**
 * @internal
 */
export type SelectedPerspective = ReleaseDocument | 'published' | 'drafts'

/**
 * @internal
 */
export type PerspectiveStack = ExtractArray<ClientPerspective>

/**
 * @internal
 */
export interface PerspectiveContextValue {
  /* The selected perspective name, it could be a release or Published */
  selectedPerspectiveName: 'published' | ReleaseId | undefined
  /**
   * The releaseId as r<string>; it will be undefined if the selected perspective is `published` or `drafts`
   */
  selectedReleaseId: ReleaseId | undefined

  /* Return the current global release */
  selectedPerspective: SelectedPerspective
  /* Change the perspective in the studio based on the perspective name */
  setPerspective: (perspectiveId: 'published' | 'drafts' | ReleaseId | undefined) => void
  /* Add/remove excluded perspectives */
  toggleExcludedPerspective: (perspectiveId: string) => void
  /* Check if a perspective is excluded */
  isPerspectiveExcluded: (perspectiveId: string) => boolean
  /**
   * The stacked array of releases ids ordered chronologically to represent the state of documents at the given point in time.
   */
  perspectiveStack: PerspectiveStack
}

type ExtractArray<Union> = Union extends unknown[] ? Union : never

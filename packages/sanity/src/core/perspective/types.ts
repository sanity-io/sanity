import {type ClientPerspective, type ReleaseId} from '@sanity/client'

import {type ReleaseDocument} from '../releases/store/types'

/**
 * @beta
 */
export type SelectedPerspective = ReleaseDocument | 'published' | 'drafts'

/**
 * @beta
 */
export type PerspectiveStack = ExtractArray<ClientPerspective>

/**
 * @beta
 */
export interface PerspectiveContextValue {
  /* The selected perspective name, it could be a release or Published */
  selectedPerspectiveName: 'published' | ReleaseId | undefined
  /**
   * The releaseId as `r<string>`; it will be undefined if the selected perspective is `published` or `drafts`
   */
  selectedReleaseId: ReleaseId | undefined

  /* Return the current global release */
  selectedPerspective: SelectedPerspective
  /**
   * The stacked array of releases ids ordered chronologically to represent the state of documents at the given point in time.
   */
  perspectiveStack: PerspectiveStack
  /* The excluded perspectives */
  excludedPerspectives: string[]
}

type ExtractArray<Union> = Union extends unknown[] ? Union : never

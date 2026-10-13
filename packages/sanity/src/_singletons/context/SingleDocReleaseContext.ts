import {createContext} from 'react'

/**
 * @internal
 */
export interface SingleDocReleaseContextValue {
  /**
   * Sets the scheduled draft perspective into the local router params.
   */
  onSetScheduledDraftPerspective: (releaseId: string) => void
}

/**
 * @internal
 */
export const SingleDocReleaseContext = createContext<SingleDocReleaseContextValue | null>(null)

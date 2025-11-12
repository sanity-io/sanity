import {createContext} from 'sanity/_createContext'

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
export const SingleDocReleaseContext = createContext<SingleDocReleaseContextValue | null>(
  'sanity/_singletons/context/single-doc-release-context',
  null,
)

import {useContext} from 'react'
import {SingleDocReleaseContext, type SingleDocReleaseContextValue} from 'sanity/_singletons'

interface SingleDocReleaseProviderProps {
  children: React.ReactNode
  onSetScheduledDraftPerspective: (releaseId: string) => void
}

/**
 * Provider for the single doc release context.
 * @internal
 */
export function SingleDocReleaseProvider({
  children,
  onSetScheduledDraftPerspective,
}: SingleDocReleaseProviderProps) {
  return (
    <SingleDocReleaseContext.Provider value={{onSetScheduledDraftPerspective}}>
      {children}
    </SingleDocReleaseContext.Provider>
  )
}

/**
 * Hook to get the single doc release context
 * @internal
 */
export function useSingleDocRelease(): SingleDocReleaseContextValue {
  const context = useContext(SingleDocReleaseContext)
  if (!context) {
    throw new Error('SingleDocReleaseContext not found')
  }
  return context
}

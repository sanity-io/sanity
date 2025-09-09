import {createContext, type ReactNode, useContext, useState} from 'react'

import {type ReleaseId} from './types'

interface CardinalityOnePerspectiveContextValue {
  cardinalityOneReleaseId: ReleaseId | null
  setCardinalityOneReleaseId: (releaseId: ReleaseId | null) => void
}

const CardinalityOnePerspectiveContext =
  createContext<CardinalityOnePerspectiveContextValue | null>(null)

/**
 * Provider for cardinality one release state management.
 *
 * DESIGN RATIONALE:
 * Cardinality one releases need special handling because they should not appear in URLs
 * (to keep URLs clean and prevent browser history pollution). Instead, we store their
 * selection state in React memory only.
 *
 * This provider manages that in-memory state and ensures it's available throughout
 * the component tree without affecting URL parameters.
 *
 * @internal
 */
export function CardinalityOnePerspectiveProvider({children}: {children: ReactNode}) {
  const [cardinalityOneReleaseId, setCardinalityOneReleaseId] = useState<ReleaseId | null>(null)

  return (
    <CardinalityOnePerspectiveContext.Provider
      value={{
        cardinalityOneReleaseId,
        setCardinalityOneReleaseId,
      }}
    >
      {children}
    </CardinalityOnePerspectiveContext.Provider>
  )
}

/**
 * @internal
 */
export function useCardinalityOnePerspective(): CardinalityOnePerspectiveContextValue {
  const context = useContext(CardinalityOnePerspectiveContext)
  if (!context) {
    throw new Error(
      'useCardinalityOnePerspective must be used within CardinalityOnePerspectiveProvider',
    )
  }
  return context
}

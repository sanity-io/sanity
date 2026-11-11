import {useMemo} from 'react'

import {usePerspectiveState} from '../c1/state'
import {useVariantDefinitions} from '../c1/world'
import {createPerspectiveMatch, type PerspectiveMatch} from './matchCore'

export {type MatchKind, matchOf, type PerspectiveMatch} from './matchCore'

/** What the chosen perspective matches, for any component inside the C1 state provider. */
export function usePerspectiveMatch(): PerspectiveMatch {
  const {chosen} = usePerspectiveState()
  const definitions = useVariantDefinitions()
  return useMemo(() => createPerspectiveMatch(chosen, definitions), [chosen, definitions])
}

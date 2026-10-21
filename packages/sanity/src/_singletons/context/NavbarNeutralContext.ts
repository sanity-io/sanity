import {createContext} from 'sanity/_createContext'

/**
 * PROPOSED (Variants 2.0 test studio). When `true`, the navbar keeps the default tone whatever the perspective: no green for Published and no
 * release colour, so the controls say the state (and the dropdowns opened from them keep the default tone too). `false` is Studio as it ships.
 * @internal
 */
export const NavbarNeutralContext = createContext<boolean>(
  'sanity/_singletons/context/navbar-neutral',
  false,
)

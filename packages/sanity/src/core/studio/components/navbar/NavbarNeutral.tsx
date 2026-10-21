import {NavbarNeutralContext} from 'sanity/_singletons'

/**
 * PROPOSED (Variants 2.0 test studio; not in stock Studio). Provide `true` to keep the navbar at the default tone: without it the navbar takes a
 * tone from the perspective (green for Published, a colour per release type), which also colours the dropdowns opened from it. Inert without a provider.
 *
 * @internal
 */
export const NavbarNeutralProvider = NavbarNeutralContext.Provider

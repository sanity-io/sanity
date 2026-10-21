import {createContext} from 'sanity/_createContext'

import type {PerspectiveMenuExtension} from '../../core/perspective/navbar/PerspectiveMenuExtension'

/**
 * PROPOSED (Variants 2.0 test studio). What a host adds to the navbar's perspective menu; `undefined` adds nothing.
 * @internal
 */
export const PerspectiveMenuExtensionContext = createContext<PerspectiveMenuExtension | undefined>(
  'sanity/_singletons/context/perspective-menu-extension',
  undefined,
)

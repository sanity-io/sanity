import {createContext} from 'react'

import type {NavbarContextValue} from '../../../core/studio/StudioLayout'

/** @internal */
export const NavbarContext = createContext<NavbarContextValue>({
  onSearchFullscreenOpenChange: () => '',
  onSearchOpenChange: () => '',
  searchFullscreenOpen: false,
  searchFullscreenPortalEl: null,
  searchOpen: false,
})

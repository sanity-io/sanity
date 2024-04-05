import {createContext} from 'react'
import type {NavbarContextValue} from 'sanity'

/** @internal */
export const NavbarContext = createContext<NavbarContextValue>({
  onSearchFullscreenOpenChange: () => '',
  onSearchOpenChange: () => '',
  searchFullscreenOpen: false,
  searchFullscreenPortalEl: null,
  searchOpen: false,
})

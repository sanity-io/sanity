import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {NavbarContextValue} from '../../core/studio/StudioLayout'

/** @internal */
export const NavbarContext: Context<NavbarContextValue> = createContext<NavbarContextValue>(
  'sanity/_singletons/context/navbar',
  {
    onSearchFullscreenOpenChange: () => '',
    onSearchOpenChange: () => '',
    searchFullscreenOpen: false,
    searchFullscreenPortalEl: null,
    searchOpen: false,
  },
)

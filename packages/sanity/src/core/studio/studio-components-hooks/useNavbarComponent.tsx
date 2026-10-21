import {type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {type NavbarProps} from '../../config/studio/types'
import {LazyStudioNavbar} from '../components/navbar/LazyStudioNavbar'
import {pickNavbarComponent} from './picks'

/**
 * @internal
 */
export function useNavbarComponent(): ComponentType<Omit<NavbarProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: LazyStudioNavbar,
    pick: pickNavbarComponent,
  })
}

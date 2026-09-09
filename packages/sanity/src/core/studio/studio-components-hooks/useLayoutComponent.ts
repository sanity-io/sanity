import {lazy, type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {pickLayoutComponent} from './picks'

const studioLayoutComponentPromise = import('../StudioLayoutComponent').then(
  ({StudioLayoutComponent}) => ({default: StudioLayoutComponent}),
)
const StudioLayoutComponent = lazy(() => studioLayoutComponentPromise)

/**
 * @internal
 */
export function useLayoutComponent(): ComponentType {
  return useMiddlewareComponents({
    defaultComponent: StudioLayoutComponent as ComponentType,
    pick: pickLayoutComponent,
  })
}

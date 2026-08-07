import {type ComponentType} from 'react'

import {type PreviewProps} from '../../components/previews/types'
import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {defaultResolvePreviewComponent} from '../studio/inputResolver/previewResolver'
import {pickPreviewComponent} from './picks'
import {useResolveDefaultComponent} from './useResolveDefaultComponent'

/**
 * @internal
 */
export function DefaultPreview(props: Omit<PreviewProps, 'renderDefault'>): React.JSX.Element {
  return useResolveDefaultComponent<PreviewProps>({
    componentProps: props,
    componentResolver: defaultResolvePreviewComponent,
  })
}

/**
 * @internal
 */
export function usePreviewComponent(): ComponentType<Omit<PreviewProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: DefaultPreview,
    pick: pickPreviewComponent,
  })
}

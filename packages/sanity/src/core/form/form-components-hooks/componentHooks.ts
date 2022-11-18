import {ComponentType} from 'react'
import {useMiddlewareComponents} from '../../config/components'
import {FieldProps, InputProps, ItemProps, RenderPreviewCallbackProps} from '../types'
import {SanityPreview} from '../../preview'
import {DefaultField, DefaultInput, DefaultItem} from './components'
import {
  pickFieldComponent,
  pickInputComponent,
  pickItemComponent,
  pickPreviewComponent,
} from './picks'

/**
 * @internal
 */
export function useInputComponent(): ComponentType<Omit<InputProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: DefaultInput,
    pick: pickInputComponent,
  })
}

/**
 * @internal
 */
export function useFieldComponent(): ComponentType<Omit<FieldProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: DefaultField,
    pick: pickFieldComponent,
  })
}

/**
 * @internal
 */
export function usePreviewComponent(): ComponentType<
  Omit<RenderPreviewCallbackProps, 'renderDefault'>
> {
  return useMiddlewareComponents({
    defaultComponent: SanityPreview,
    pick: pickPreviewComponent,
  })
}

/**
 * @internal
 */
export function useItemComponent(): ComponentType<Omit<ItemProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: DefaultItem,
    pick: pickItemComponent,
  })
}

import {ComponentType} from 'react'
import {useMiddlewareComponents} from '../../config/components'
import {FieldProps, InputProps, ItemProps} from '../types'
import {PreviewProps} from '../../components'
import {DefaultField, DefaultInput, DefaultItem, DefaultPreview} from './components'
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
export function usePreviewComponent(): ComponentType<Omit<PreviewProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: DefaultPreview,
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

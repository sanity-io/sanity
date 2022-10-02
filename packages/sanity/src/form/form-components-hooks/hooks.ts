import {ComponentType} from 'react'
import {PreviewProps} from '../../components/previews'
import {useMiddlewareComponents} from '../../config/components/helpers'
import {InputProps, FieldProps, ItemProps} from '../types'
import {DefaultInput, DefaultField, DefaultItem, DefaultPreview} from './components'
import {
  pickInputComponent,
  pickFieldComponent,
  pickPreviewComponent,
  pickItemComponent,
} from './picks'

/**
 * @internal
 */
export function useInputComponent(): ComponentType<InputProps> {
  return useMiddlewareComponents({
    defaultComponent: DefaultInput,
    pick: pickInputComponent,
  })
}

/**
 * @internal
 */
export function useFieldComponent(): ComponentType<FieldProps> {
  return useMiddlewareComponents({
    defaultComponent: DefaultField,
    pick: pickFieldComponent,
  })
}

/**
 * @internal
 */
export function usePreviewComponent(): ComponentType<PreviewProps> {
  return useMiddlewareComponents({
    defaultComponent: DefaultPreview,
    pick: pickPreviewComponent,
  })
}

/**
 * @internal
 */
export function useItemComponent(): ComponentType<ItemProps> {
  return useMiddlewareComponents({
    defaultComponent: DefaultItem,
    pick: pickItemComponent,
  })
}

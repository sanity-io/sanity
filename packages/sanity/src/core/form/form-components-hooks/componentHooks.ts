import {ComponentType} from 'react'
import {PreviewProps} from '../../components/previews'
import {useMiddlewareComponents} from '../../config/components'
import {DiffProps} from '../../field'
import {InputProps, FieldProps, ItemProps} from '../types'
import {DefaultInput, DefaultField, DefaultItem, DefaultPreview, DefaultDiff} from './components'
import {
  pickInputComponent,
  pickFieldComponent,
  pickPreviewComponent,
  pickItemComponent,
  pickDiffComponent,
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

/**
 * @internal
 */
export function useDiffComponent(): ComponentType<Omit<DiffProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: DefaultDiff,
    pick: pickDiffComponent,
  })
}

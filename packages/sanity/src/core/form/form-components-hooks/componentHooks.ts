import {type ComponentType} from 'react'

import {type PreviewProps} from '../../components/previews/types'
import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {type BlockAnnotationProps, type BlockProps} from '../types/blockProps'
import {type FieldProps} from '../types/fieldProps'
import {type InputProps} from '../types/inputProps'
import {type ItemProps} from '../types/itemProps'
import {
  DefaultAnnotation,
  DefaultBlock,
  DefaultField,
  DefaultInlineBlock,
  DefaultInput,
  DefaultItem,
  DefaultPreview,
} from './components'
// ok above
import {
  pickAnnotationComponent,
  pickBlockComponent,
  pickFieldComponent,
  pickInlineBlockComponent,
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

/**
 * @internal
 */
export function useBlockComponent(): ComponentType<Omit<BlockProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: DefaultBlock,
    pick: pickBlockComponent,
  })
}

/**
 * @internal
 */
export function useInlineBlockComponent(): ComponentType<Omit<BlockProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: DefaultInlineBlock,
    pick: pickInlineBlockComponent,
  })
}

/**
 * @internal
 */
export function useAnnotationComponent(): ComponentType<
  Omit<BlockAnnotationProps, 'renderDefault'>
> {
  return useMiddlewareComponents({
    defaultComponent: DefaultAnnotation,
    pick: pickAnnotationComponent,
  })
}

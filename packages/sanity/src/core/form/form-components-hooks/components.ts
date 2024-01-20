import {type SchemaType} from '@sanity/types'
import {type ComponentType, createElement, type ReactElement, useCallback} from 'react'

import {type PreviewProps} from '../../components/previews'
import {
  defaultResolveAnnotationComponent,
  defaultResolveBlockComponent,
  defaultResolveInlineBlockComponent,
} from '../studio/inputResolver/blockResolver'
import {defaultResolveFieldComponent} from '../studio/inputResolver/fieldResolver'
import {
  defaultResolveInputComponent,
  defaultResolvePreviewComponent,
} from '../studio/inputResolver/inputResolver'
import {defaultResolveItemComponent} from '../studio/inputResolver/itemResolver'
import {
  type BlockAnnotationProps,
  type BlockProps,
  type FieldProps,
  type InputProps,
  type ItemProps,
} from '../types'

function useResolveDefaultComponent<T extends {schemaType?: SchemaType}>(props: {
  componentProps: Omit<T, 'renderDefault'>
  componentResolver: (schemaType: SchemaType) => ComponentType<Omit<T, 'renderDefault'>>
}): ReactElement<T> {
  const {componentResolver, componentProps} = props

  // NOTE: this will not happen, but we do this to avoid updating too many places
  // TODO: We need to clean up the preview machinery + types to remove this
  if (!componentProps.schemaType) {
    throw new Error('the `schemaType` property must be defined')
  }

  const defaultResolvedComponent = componentResolver(componentProps.schemaType)

  const renderDefault = useCallback(
    (parentTypeProps: T) => {
      if (!parentTypeProps.schemaType?.type) {
        // In theory this should not be possible, and this error should never be thrown
        throw new Error('Attempted to render form component of non-existent parent type')
      }

      // The components property is removed from the schemaType object
      // in order to prevent that a component is render itself
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {components, ...restSchemaType} = parentTypeProps.schemaType
      const parentTypeResolvedComponent = componentResolver(restSchemaType)
      return createElement(parentTypeResolvedComponent, parentTypeProps)
    },
    [componentResolver],
  )

  return createElement(defaultResolvedComponent, {
    ...componentProps,
    renderDefault,
  }) as ReactElement<T>
}

/**
 * @internal
 */
export function DefaultInput(props: Omit<InputProps, 'renderDefault'>): ReactElement {
  return useResolveDefaultComponent<Omit<InputProps, 'renderDefault'>>({
    componentProps: props,
    componentResolver: defaultResolveInputComponent,
  })
}

/**
 * @internal
 */
export function DefaultField(props: Omit<FieldProps, 'renderDefault'>): ReactElement {
  return useResolveDefaultComponent<Omit<FieldProps, 'renderDefault'>>({
    componentProps: props,
    componentResolver: defaultResolveFieldComponent,
  })
}

/**
 * @internal
 */
export function DefaultItem(props: Omit<ItemProps, 'renderDefault'>): ReactElement {
  return useResolveDefaultComponent<Omit<ItemProps, 'renderDefault'>>({
    componentProps: props,
    componentResolver: defaultResolveItemComponent,
  })
}

/**
 * @internal
 */
export function DefaultPreview(props: Omit<PreviewProps, 'renderDefault'>): ReactElement {
  return useResolveDefaultComponent<PreviewProps>({
    componentProps: props,
    componentResolver: defaultResolvePreviewComponent,
  })
}

/**
 * @internal
 */
export function DefaultBlock(props: Omit<BlockProps, 'renderDefault'>): ReactElement {
  return useResolveDefaultComponent<Omit<BlockProps, 'renderDefault'>>({
    componentProps: props,
    componentResolver: defaultResolveBlockComponent,
  })
}

/**
 * @internal
 */
export function DefaultInlineBlock(props: Omit<BlockProps, 'renderDefault'>): ReactElement {
  return useResolveDefaultComponent<Omit<BlockProps, 'renderDefault'>>({
    componentProps: props,
    componentResolver: defaultResolveInlineBlockComponent,
  })
}

/**
 * @internal
 */
export function DefaultAnnotation(
  props: Omit<BlockAnnotationProps, 'renderDefault'>,
): ReactElement {
  return useResolveDefaultComponent<Omit<BlockAnnotationProps, 'renderDefault'>>({
    componentProps: props,
    componentResolver: defaultResolveAnnotationComponent,
  })
}

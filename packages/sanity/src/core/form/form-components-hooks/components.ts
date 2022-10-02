import {SchemaType} from '@sanity/types'
import React, {useCallback, createElement} from 'react'
import {PreviewProps} from '../../components/previews'
import {
  defaultResolveInputComponent,
  defaultResolveFieldComponent,
  defaultResolveItemComponent,
  defaultResolvePreviewComponent,
} from '../studio/inputResolver/inputResolver'
import {InputProps, FieldProps, ItemProps} from '../types'

function useResolveDefaultComponent<T>(props: {
  componentProps: T & {schemaType: SchemaType}
  componentResolver: (schemaType: SchemaType) => React.ComponentType<T>
}): React.ReactElement<T> {
  const {componentResolver, componentProps} = props
  const defaultResolvedComponent = componentResolver(
    componentProps.schemaType
  ) as React.ComponentType<any>

  const renderDefault = useCallback(
    (parentTypeProps: T) => {
      if (!componentProps.schemaType?.type) {
        // In theory this should not be possible, and this error should never be thrown
        throw new Error('Attempted to render form component of non-existent parent type')
      }

      // The components property is removed from the schemaType object
      // in order to prevent that a component is render itself
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {components, ...restSchemaType} = componentProps.schemaType
      const parentTypeResolvedComponent = componentResolver(
        restSchemaType
      ) as React.ComponentType<any>
      return createElement(parentTypeResolvedComponent, parentTypeProps)
    },
    [componentProps.schemaType, componentResolver]
  )

  return createElement(defaultResolvedComponent, {
    ...componentProps,
    renderDefault,
  }) as React.ReactElement<T>
}

/**
 * @internal
 */
export function DefaultInput(props: InputProps): React.ReactElement<InputProps> {
  return useResolveDefaultComponent<InputProps>({
    componentProps: props,
    componentResolver: defaultResolveInputComponent,
  })
}

/**
 * @internal
 */
export function DefaultField(props: FieldProps): React.ReactElement<FieldProps> {
  return useResolveDefaultComponent<FieldProps>({
    componentProps: props,
    componentResolver: defaultResolveFieldComponent,
  })
}

/**
 * @internal
 */
export function DefaultItem(props: ItemProps): React.ReactElement<ItemProps> {
  return useResolveDefaultComponent<ItemProps>({
    componentProps: props,
    componentResolver: defaultResolveItemComponent,
  })
}

/**
 * @internal
 */
export function DefaultPreview(props: PreviewProps): React.ReactElement<PreviewProps> {
  return useResolveDefaultComponent<PreviewProps>({
    componentProps: props as any,
    componentResolver: defaultResolvePreviewComponent,
  })
}

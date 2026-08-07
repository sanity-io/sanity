import {type SchemaType} from '@sanity/types'
import {type ComponentType, useCallback, useMemo} from 'react'

// Each form component hook lives in its own module (together with the default component it
// resolves) so that form components which consume a sibling hook (e.g. `ListArrayInput` uses
// `useItemComponent`, `Preview` uses `usePreviewComponent`) only pull in that hook's resolver
// subtree instead of every resolver, which would create circular imports through the shared
// module.

/**
 * @internal
 */
export function useResolveDefaultComponent<T extends {schemaType?: SchemaType}>(props: {
  componentProps: Omit<T, 'renderDefault'>
  componentResolver: (schemaType: SchemaType) => ComponentType<Omit<T, 'renderDefault'>>
}): React.JSX.Element {
  const {componentResolver, componentProps} = props
  const {schemaType} = componentProps

  // NOTE: this will not happen, but we do this to avoid updating too many places
  // TODO: We need to clean up the preview machinery + types to remove this
  if (!schemaType) {
    throw new Error('the `schemaType` property must be defined')
  }

  // Memoized so the resolved component keeps a stable identity across renders; a new identity
  // would make React unmount and remount the subtree.
  const DefaultResolvedComponent = useMemo(
    () => componentResolver(schemaType),
    [componentResolver, schemaType],
  )

  const renderDefault = useCallback(
    (parentTypeProps: T) => {
      if (!parentTypeProps.schemaType?.type) {
        // In theory this should not be possible, and this error should never be thrown
        throw new Error('Attempted to render form component of non-existent parent type')
      }

      // The components property is removed from the schemaType object
      // in order to prevent that a component is render itself
      // oxlint-disable-next-line no-unused-vars
      const {components, ...restSchemaType} = parentTypeProps.schemaType
      const ParentTypeResolvedComponent = componentResolver(restSchemaType)
      return <ParentTypeResolvedComponent {...parentTypeProps} />
    },
    [componentResolver],
  )

  // oxlint-disable-next-line react/react-compiler -- this is intentional and how the middleware components has to work
  return <DefaultResolvedComponent {...componentProps} renderDefault={renderDefault} />
}

import {rem, Skeleton} from '@sanity/ui'
import {type ComponentType, Suspense} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {defaultResolveInputComponent} from '../studio/inputResolver/inputResolver'
import {type InputProps} from '../types/inputProps'
import {pickInputComponent} from './picks'
import {useResolveDefaultComponent} from './useResolveDefaultComponent'

/**
 * @internal
 */
function DefaultInput(props: Omit<InputProps, 'renderDefault'>): React.JSX.Element {
  const input = useResolveDefaultComponent<Omit<InputProps, 'renderDefault'>>({
    componentProps: props,
    componentResolver: defaultResolveInputComponent,
  })

  // The document's own input is the whole form, so it keeps `FormBuilder`'s loading block
  if (!props.schemaType.components?.input || props.path.length === 0) {
    return input
  }

  // A schema type's custom input can suspend on data that only settles once the document exists
  // (an SDK projection of a new document never does). Without a boundary of its own it would
  // suspend the whole form, leaving no field to edit that could create the document. The fallback
  // has the height of a single-line input; boolean and datetime inputs render their own label, so
  // for those the title is missing until the input loads.
  return (
    <Suspense
      fallback={
        <Skeleton
          data-testid="custom-input-fallback"
          radius={1}
          animated
          style={{height: rem(35)}}
        />
      }
    >
      {input}
    </Suspense>
  )
}

/**
 * @internal
 */
export function useInputComponent(): ComponentType<Omit<InputProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: DefaultInput,
    pick: pickInputComponent,
  })
}

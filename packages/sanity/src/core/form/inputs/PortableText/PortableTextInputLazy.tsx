import {lazy, Suspense} from 'react'

import {LoadingBlock} from '../../../components/loadingBlock'
import {type PortableTextInputProps} from '../../types'

const PortableTextInputComponent = lazy(() =>
  import('./PortableTextInput').then((module) => ({default: module.PortableTextInput})),
)

/**
 * Eager shim that defers the Portable Text editor module graph until a
 * portable-text field renders. Carries its own Suspense boundary.
 *
 * @internal
 */
export function PortableTextInputLazy(props: PortableTextInputProps) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <PortableTextInputComponent {...props} />
    </Suspense>
  )
}

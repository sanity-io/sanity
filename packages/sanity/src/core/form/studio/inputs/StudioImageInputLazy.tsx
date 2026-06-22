import {lazy, Suspense} from 'react'

import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {type ImageInputProps} from './StudioImageInput'

const StudioImageInputComponent = lazy(() =>
  import('./StudioImageInput').then((module) => ({default: module.StudioImageInput})),
)

/**
 * Eager shim that defers the image input module graph until an image field
 * renders. Carries its own Suspense boundary.
 *
 * @internal
 */
export function StudioImageInputLazy(props: ImageInputProps) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <StudioImageInputComponent {...props} />
    </Suspense>
  )
}

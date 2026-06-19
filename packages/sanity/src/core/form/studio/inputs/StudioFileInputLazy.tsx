import {lazy, Suspense} from 'react'

import {LoadingBlock} from '../../../components/loadingBlock'
import {type FileInputProps} from './StudioFileInput'

const StudioFileInputComponent = lazy(() =>
  import('./StudioFileInput').then((module) => ({default: module.StudioFileInput})),
)

/**
 * Eager shim that defers the file input module graph until a file field
 * renders. Carries its own Suspense boundary.
 *
 * @internal
 */
export function StudioFileInputLazy(props: FileInputProps) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <StudioFileInputComponent {...props} />
    </Suspense>
  )
}

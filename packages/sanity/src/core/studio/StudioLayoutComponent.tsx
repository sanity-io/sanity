import {lazy, Suspense} from 'react'

import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'

const studioLayoutComponentPromise = import('./StudioLayoutComponentImpl').then(
  ({StudioLayoutComponent}) => ({
    default: StudioLayoutComponent,
  }),
)
const StudioLayoutComponentImpl = lazy(() => studioLayoutComponentPromise)

export function StudioLayoutComponent() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <StudioLayoutComponentImpl />
    </Suspense>
  )
}

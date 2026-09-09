import {lazy, Suspense} from 'react'

import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'

const StudioLayoutComponentImpl = lazy(() =>
  import('./StudioLayoutComponentImpl').then(({StudioLayoutComponent}) => ({
    default: StudioLayoutComponent,
  })),
)

export function StudioLayoutComponent() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <StudioLayoutComponentImpl />
    </Suspense>
  )
}

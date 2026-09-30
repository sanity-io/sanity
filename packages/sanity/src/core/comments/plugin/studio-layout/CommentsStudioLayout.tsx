import {type ReactNode, Suspense, use} from 'react'
import {type ObservablePromise} from 'react-rx'

import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {type LayoutProps} from '../../../config/studio/types'
import {
  FEATURES,
  type SettledFeatures,
  useFeatureEnabledPromise,
} from '../../../hooks/useFeatureEnabled'
import {AddonDatasetProvider} from '../../../studio/addonDataset/AddonDatasetProvider'
import {CommentsOnboardingProvider} from '../../context/onboarding/CommentsOnboardingProvider'
import {CommentsUpsellProvider} from '../../context/upsell/CommentsUpsellProvider'

function CommentsUpsellGate(props: {
  children: ReactNode
  featureEnabledPromise: ObservablePromise<SettledFeatures>
}) {
  const {children, featureEnabledPromise} = props
  // Settled before the first paint: whether the upsell provider wraps the layout is decided
  // once, so the whole studio below it is never remounted by a late answer.
  const {enabled} = use(featureEnabledPromise)
  return enabled ? children : <CommentsUpsellProvider>{children}</CommentsUpsellProvider>
}

export function CommentsStudioLayout(props: LayoutProps) {
  const featureEnabledPromise = useFeatureEnabledPromise(FEATURES.studioComments)

  // The boundary sits between the hook and the `use()`, so this component commits and the request
  // starts; its fallback is the same loading screen `StudioLayout` shows for the lazy layout chunk.
  return (
    <AddonDatasetProvider>
      <CommentsOnboardingProvider>
        <Suspense fallback={<LoadingBlock />}>
          <CommentsUpsellGate featureEnabledPromise={featureEnabledPromise}>
            {props.renderDefault(props)}
          </CommentsUpsellGate>
        </Suspense>
      </CommentsOnboardingProvider>
    </AddonDatasetProvider>
  )
}

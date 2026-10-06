import {type LayoutProps} from '../../../config/studio/types'
import {AddonDatasetProvider} from '../../../studio/addonDataset/AddonDatasetProvider'
import {CommentsOnboardingProvider} from '../../context/onboarding/CommentsOnboardingProvider'
import {CommentsUpsellProvider} from '../../context/upsell/CommentsUpsellProvider'

export function CommentsStudioLayout(props: LayoutProps) {
  // Same tree in both modes, so the layout never waits for the feature check; the upsell
  // provider is only consulted by UI that already knows it is in upsell mode.
  return (
    <AddonDatasetProvider>
      <CommentsOnboardingProvider>
        <CommentsUpsellProvider>{props.renderDefault(props)}</CommentsUpsellProvider>
      </CommentsOnboardingProvider>
    </AddonDatasetProvider>
  )
}

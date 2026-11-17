import {type LayoutProps} from '../../../config/studio/types'
import {AddonDatasetProvider} from '../../../studio/addonDataset/AddonDatasetProvider'
import {CommentsOnboardingProvider} from '../../context/onboarding/CommentsOnboardingProvider'
import {CommentsUpsellProvider} from '../../context/upsell/CommentsUpsellProvider'

export function CommentsStudioLayout(props: LayoutProps) {
  // Same tree in both plan modes, so the layout never waits for the comments feature check: the
  // upsell provider's dialog reads it at the leaf, and the UI that opens the dialog already knows
  // it is in upsell mode.
  return (
    <AddonDatasetProvider>
      <CommentsOnboardingProvider>
        <CommentsUpsellProvider>{props.renderDefault(props)}</CommentsUpsellProvider>
      </CommentsOnboardingProvider>
    </AddonDatasetProvider>
  )
}

import {use} from 'react'

import {type LayoutProps} from '../../../config/studio/types'
import {AddonDatasetProvider} from '../../../studio/addonDataset/AddonDatasetProvider'
import {CommentsOnboardingProvider} from '../../context/onboarding/CommentsOnboardingProvider'
import {CommentsUpsellProvider} from '../../context/upsell/CommentsUpsellProvider'
import {useCommentsFeaturesPromise} from '../../hooks/useCommentsFeaturesPromise'

export function CommentsStudioLayout(props: LayoutProps) {
  const commentsFeaturesPromise = useCommentsFeaturesPromise()
  const {enabled} = use(commentsFeaturesPromise)
  const children = props.renderDefault(props)

  return (
    <AddonDatasetProvider>
      <CommentsOnboardingProvider>
        {enabled ? children : <CommentsUpsellProvider>{children}</CommentsUpsellProvider>}
      </CommentsOnboardingProvider>
    </AddonDatasetProvider>
  )
}

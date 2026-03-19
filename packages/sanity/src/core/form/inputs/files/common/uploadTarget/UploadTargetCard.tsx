import {Card} from '@sanity/ui'
import {forwardRef, type ComponentProps, type Ref} from 'react'

import {withFocusRing} from '../../../../components/withFocusRing'
import {uploadTarget} from './uploadTarget'
import {uploadTargetCard} from './UploadTargetCard.css'

const StyledCard = forwardRef(function StyledCard(
  props: ComponentProps<typeof Card>,
  ref: Ref<HTMLDivElement>,
) {
  return <Card {...props} className={uploadTargetCard} ref={ref} />
})

export const UploadTargetCard = withFocusRing(uploadTarget(StyledCard))

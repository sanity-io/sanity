import {Card, type CardProps} from '@sanity/ui'
import {clsx} from 'clsx'

import {withFocusRing} from '../../../../components/withFocusRing/withFocusRing'
import {uploadTarget} from './uploadTarget'
import {styledCard} from './UploadTargetCard.css'

function StyledCard(props: CardProps) {
  const {className, ...rest} = props
  return <Card {...rest} className={clsx(styledCard, className)} />
}

export const UploadTargetCard = withFocusRing(uploadTarget(StyledCard))

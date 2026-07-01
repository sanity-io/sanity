import {Card, type CardProps} from '@sanity/ui'
import {type ComponentType} from 'react'
import {styled} from 'styled-components'

import {withFocusRing} from '../../../../components/withFocusRing'
import {uploadTarget} from './uploadTarget'

const StyledCard = styled(Card as ComponentType<CardProps>)`
  height: 100%;
`

export const UploadTargetCard = withFocusRing(uploadTarget(StyledCard))

import {Card} from '@sanity/ui'
import {styled} from 'styled-components'

import {withFocusRing} from '../../../components/withFocusRing/withFocusRing'
import {uploadTarget} from './uploadTarget/uploadTarget'

const StyledCard = styled(Card)`
  height: 100%;
`

export const UploadTargetCard = withFocusRing(uploadTarget(StyledCard))

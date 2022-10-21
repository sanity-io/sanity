import {Card} from '@sanity/ui'
import {withFocusRing} from '../../../components/withFocusRing'
import {uploadTarget} from './uploadTarget/uploadTarget'

export const UploadTargetCard = uploadTarget(withFocusRing(Card))

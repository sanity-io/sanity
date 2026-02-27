import {Card} from '@sanity/ui'

import {withFocusRing} from '../../../components/withFocusRing'
import {fileTarget} from './fileTarget'

export type {FileInfo} from './fileTarget'

// Note: FileTarget needs its own focusRing because we need show it on click, not only when :focus-visible
export const FileTarget = withFocusRing(fileTarget(Card))

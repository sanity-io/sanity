/* eslint-disable import/named */

import {Card} from '@sanity/ui'
import {fileTarget} from '../../common/fileTarget'
import {withFocusRing} from '../../../components/withFocusRing'

export type {FileInfo} from '../../common/fileTarget'

// Note: FileTarget needs its own focusRing because we need show it on click, not only when :focus-visible
export const FileTarget = fileTarget(withFocusRing(Card))

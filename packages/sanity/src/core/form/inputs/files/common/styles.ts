/* eslint-disable import/named */

import {Card} from '@sanity/ui'

import {withFocusRing} from '../../../components/withFocusRing'
import {fileTarget} from '../../common/fileTarget'

export type {FileInfo} from '../../common/fileTarget'

// Note: FileTarget needs its own focusRing because we need show it on click, not only when :focus-visible
export const FileTarget = withFocusRing(fileTarget(Card))

import {DotIcon} from '@sanity/icons'
import {type BundleDocument} from 'sanity'

import {getReleaseTone} from '../../util/getReleaseTone'
import {VersionAvatar} from './VersionAvatar'

export function ReleaseAvatar({
  fontSize,
  padding,
  release,
}: {
  fontSize?: number
  padding?: number
  release: BundleDocument
}) {
  return (
    <VersionAvatar
      fontSize={fontSize}
      padding={padding}
      icon={DotIcon}
      tone={getReleaseTone(release)}
    />
  )
}

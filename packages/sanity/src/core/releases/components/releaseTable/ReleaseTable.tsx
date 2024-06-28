import {Stack} from '@sanity/ui'

import {type Version} from '../../../util/versions/util'
import {ReleaseHeader} from './ReleaseHeader'
import {ReleaseRow} from './ReleaseRow'
import {RowStack} from './RowStack'

type Props = {
  releases: Version[]
}

export function ReleaseTable({releases}: Props) {
  return (
    <Stack as="table" space={1}>
      <ReleaseHeader />
      <RowStack as="tbody">
        {releases.map((release) => (
          <ReleaseRow key={release.name} release={release} />
        ))}
      </RowStack>
    </Stack>
  )
}

import {Skeleton, Stack} from '@sanity/ui'
import {Flex} from 'ui5'

import {AvatarSkeleton, UserAvatar} from '../../../../components/userAvatar/UserAvatar'
import {ReleaseTime} from '../../components/ReleaseTime'
import {type VisibleColumn} from '../../components/Table/types'
import {useReleaseCreator} from '../hooks/useReleaseCreator'
import {type TableRelease} from '../ReleasesOverview'

export const ScheduledDraftMetadataCell: VisibleColumn<TableRelease>['cell'] = ({
  datum,
  cellProps,
}) => {
  // Skeleton IDs don't start with _.releases
  // so pass undefined in loading cases
  const {createdBy, loading: creatorLoading} = useReleaseCreator(
    datum.isLoading ? undefined : datum._id,
    datum.isLoading,
  )

  if (datum.isLoading || !datum.metadata) {
    return (
      <Flex {...cellProps} alignItems="center" paddingX={2} paddingY={3}>
        <Skeleton animated radius={2} style={{height: '40px', width: '150px'}} />
      </Flex>
    )
  }

  return (
    <Flex {...cellProps} alignItems="center" paddingX={2} paddingY={3}>
      <Flex alignItems="center" gap={3}>
        {creatorLoading && <AvatarSkeleton $size={1} animated />}
        {!creatorLoading && createdBy && <UserAvatar user={createdBy} size={1} />}
        <Stack gap={1}>
          <ReleaseTime release={datum} />
        </Stack>
      </Flex>
    </Flex>
  )
}

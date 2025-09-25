import {Flex, Skeleton, Stack, Text} from '@sanity/ui'

import {AvatarSkeleton, UserAvatar} from '../../../../components'
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
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
        <Skeleton animated radius={2} style={{height: '40px', width: '150px'}} />
      </Flex>
    )
  }

  return (
    <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
      <Flex align="center" gap={3}>
        {creatorLoading && <AvatarSkeleton $size={1} animated />}
        {!creatorLoading && createdBy && <UserAvatar user={createdBy} size={1} />}
        <Stack gap={1}>
          <Text size={1}>
            <ReleaseTime release={datum} />
          </Text>
        </Stack>
      </Flex>
    </Flex>
  )
}

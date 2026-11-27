import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Skeleton, useTheme_v2} from '@sanity/ui'
import {Flex, Icon, VStack} from 'ui5'

import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {AvatarSkeleton, UserAvatar} from '../../../../components/userAvatar/UserAvatar'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {getPublishedId} from '../../../../util/draftUtils'
import {releasesLocaleNamespace} from '../../../i18n'
import {ReleaseTime} from '../../components/ReleaseTime'
import {type VisibleColumn} from '../../components/Table/types'
import {usePublishedDocumentType} from '../hooks/usePublishedDocumentType'
import {useReleaseCreator} from '../hooks/useReleaseCreator'
import {useScheduledDraftRowDocument} from '../hooks/useScheduledDraftRowDocument'
import {type TableRelease} from '../ReleasesOverview'

/** Takes the place of the creator's avatar, which is unknown once history has been removed. */
function HistoryRemovedIcon({documentId}: {documentId: string}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const avatarSize = useTheme_v2().avatar.sizes[1]?.size
  const {documentType: publishedDocumentType} = usePublishedDocumentType(getPublishedId(documentId))

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
      style={{width: avatarSize, height: avatarSize}}
    >
      <Tooltip
        portal
        content={
          publishedDocumentType
            ? t('document-preview.history-unavailable')
            : t('document-preview.history-unavailable.no-published-document')
        }
      >
        <Icon
          data-testid="scheduled-draft-history-unavailable"
          muted
          size={1}
          icon={InfoOutlineIcon}
        />
      </Tooltip>
    </Flex>
  )
}

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
  const {missingDocument} = useScheduledDraftRowDocument(datum)

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
        {!creatorLoading && missingDocument?.reason === 'history-removed' && (
          <HistoryRemovedIcon documentId={missingDocument.documentId} />
        )}
        <VStack gap={1}>
          <ReleaseTime release={datum} />
        </VStack>
      </Flex>
    </Flex>
  )
}

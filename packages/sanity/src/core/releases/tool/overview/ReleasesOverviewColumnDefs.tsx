import {LockIcon, PinFilledIcon, PinIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {format} from 'date-fns'
import {type TFunction} from 'i18next'
import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {Button, Tooltip} from '../../../../ui-components'
import {RelativeTime} from '../../../components'
import {Translate, useTranslation} from '../../../i18n'
import {ReleaseAvatar} from '../../components/ReleaseAvatar'
import {usePerspective} from '../../hooks/usePerspective'
import {releasesLocaleNamespace} from '../../i18n'
import {getBundleIdFromReleaseDocumentId} from '../../util/getBundleIdFromReleaseDocumentId'
import {getReleaseTone} from '../../util/getReleaseTone'
import {getReleasePublishDate, isReleaseScheduledOrScheduling} from '../../util/util'
import {type TableRowProps} from '../components/Table/Table'
import {Headers} from '../components/Table/TableHeader'
import {type Column} from '../components/Table/types'
import {ReleaseDocumentsCounter} from './ReleaseDocumentsCounter'
import {type TableRelease} from './ReleasesOverview'

const ReleaseTime = ({release}: {release: TableRelease}) => {
  const {t} = useTranslation()
  const {metadata} = release

  const getTimeString = () => {
    if (metadata.releaseType === 'asap') {
      return t('release.type.asap')
    }
    if (metadata.releaseType === 'undecided') {
      return t('release.type.undecided')
    }

    const publishDate = getReleasePublishDate(release)

    return publishDate ? format(new Date(publishDate), 'PPpp') : null
  }

  return (
    <Text muted size={1}>
      {getTimeString()}
    </Text>
  )
}

const ReleaseNameCell: Column<TableRelease>['cell'] = ({cellProps, datum: release}) => {
  const router = useRouter()
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const {currentGlobalBundleId, setPerspective, setPerspectiveFromReleaseDocumentId} =
    usePerspective()
  const {state, _id} = release
  const isArchived = state === 'archived'

  const handlePinRelease = useCallback(() => {
    if (_id === currentGlobalBundleId) {
      setPerspective('drafts')
    } else {
      setPerspectiveFromReleaseDocumentId(_id)
    }
  }, [_id, currentGlobalBundleId, setPerspective, setPerspectiveFromReleaseDocumentId])

  const cardProps: TableRowProps = release.isDeleted
    ? {tone: 'transparent'}
    : {
        as: 'a',
        // navigate to release detail
        onClick: () => router.navigate({releaseId: getBundleIdFromReleaseDocumentId(release._id)}),
        tone: 'inherit',
      }

  const isReleasePinned = _id === currentGlobalBundleId
  const pinButtonIcon = isReleasePinned ? PinFilledIcon : PinIcon
  const displayTitle = release.metadata.title || tCore('release.placeholder-untitled-release')

  return (
    <Box {...cellProps} marginLeft={3} flex={1} padding={1}>
      <Tooltip
        disabled={!release.isDeleted}
        content={
          <Text size={1}>
            <Translate t={t} i18nKey="deleted-release" values={{title: displayTitle}} />
          </Text>
        }
      >
        <Flex align="center" gap={4}>
          <Button
            tooltipProps={{
              disabled: isArchived || release.state === 'published',
              content: t('dashboard.details.pin-release'),
            }}
            disabled={isArchived || release.state === 'published'}
            icon={pinButtonIcon}
            mode="bleed"
            onClick={handlePinRelease}
            padding={2}
            round
            selected={_id === currentGlobalBundleId}
          />
          <Card {...cardProps} padding={2} radius={2} flex={1}>
            <Flex align="center" gap={2}>
              <Box flex="none">
                <ReleaseAvatar tone={getReleaseTone(release)} />
              </Box>
              <Stack flex={1} space={2}>
                <Flex align="center" gap={2}>
                  <Text size={1} weight="medium">
                    {displayTitle}
                  </Text>
                </Flex>
              </Stack>
            </Flex>
          </Card>
        </Flex>
      </Tooltip>
    </Box>
  )
}

export const releasesOverviewColumnDefs: (
  t: TFunction<'releases', undefined>,
) => Column<TableRelease>[] = (t) => {
  return [
    {
      id: 'title',
      sorting: false,
      width: null,
      style: {minWidth: '50%'},
      header: ({headerProps}) => (
        <Flex {...headerProps} flex={1} marginLeft={3} paddingY={3} sizing="border">
          <Headers.BasicHeader text={t('table-header.title')} />
        </Flex>
      ),
      cell: ReleaseNameCell,
    },
    {
      id: 'publishAt',
      sorting: true,
      sortTransform: ({metadata, publishAt}) => {
        if (metadata.releaseType === 'undecided') return Infinity

        const publishDate = getReleasePublishDate({metadata, publishAt})
        if (metadata.releaseType === 'asap' || !publishDate) return 0
        return new Date(publishDate).getTime()
      },
      width: 250,
      header: (props) => (
        <Flex
          {...props.headerProps}
          align="center"
          gap={1}
          paddingX={1}
          paddingY={0}
          sizing="border"
        >
          <Headers.SortHeaderButton text={t('table-header.time')} {...props} />
        </Flex>
      ),
      cell: ({cellProps, datum: release}) => (
        <Flex {...cellProps} align="center" paddingX={2} paddingY={3} gap={2} sizing="border">
          <ReleaseTime release={release} />
          {isReleaseScheduledOrScheduling(release) && (
            <Text size={1}>
              <LockIcon />
            </Text>
          )}
        </Flex>
      ),
    },
    {
      id: 'documentsMetadata.updatedAt',
      sorting: true,
      width: 150,
      header: (props) => (
        <Flex {...props.headerProps} paddingY={3} sizing="border">
          <Headers.SortHeaderButton text={t('table-header.edited')} {...props} />
        </Flex>
      ),
      cell: ({datum: {documentsMetadata}, cellProps}) => (
        <Flex {...cellProps} align="center" gap={2} paddingX={2} paddingY={3} sizing="border">
          <Text muted size={1}>
            {documentsMetadata?.updatedAt ? (
              <RelativeTime time={documentsMetadata.updatedAt} useTemporalPhrase minimal />
            ) : (
              '-'
            )}
          </Text>
        </Flex>
      ),
    },
    {
      id: 'documentCount',
      sorting: false,
      width: 100,
      header: ({headerProps}) => (
        <Flex {...headerProps} paddingY={3} sizing="border">
          <Headers.BasicHeader text={''} />
        </Flex>
      ),
      cell: ({datum: {isDeleted, documentsMetadata}, cellProps}) => (
        <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
          {!isDeleted && documentsMetadata && (
            <ReleaseDocumentsCounter releaseDocumentMetadata={documentsMetadata} />
          )}
        </Flex>
      ),
    },
  ]
}

import {LockIcon, PinFilledIcon, PinIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {format} from 'date-fns'
import {type TFunction} from 'i18next'
import {useCallback, useMemo} from 'react'
import {useRouter} from 'sanity/router'

import {Button, Tooltip} from '../../../../ui-components'
import {RelativeTime} from '../../../components'
import {Translate, useTranslation} from '../../../i18n'
import useTimeZone, {getLocalTimeZone} from '../../../scheduledPublishing/hooks/useTimeZone'
import {ReleaseAvatar} from '../../components/ReleaseAvatar'
import {usePerspective} from '../../hooks/usePerspective'
import {releasesLocaleNamespace} from '../../i18n'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseTone} from '../../util/getReleaseTone'
import {getPublishDateFromRelease, isReleaseScheduledOrScheduling} from '../../util/util'
import {type TableRowProps} from '../components/Table/Table'
import {Headers} from '../components/Table/TableHeader'
import {type Column} from '../components/Table/types'
import {ReleaseDocumentsCounter} from './ReleaseDocumentsCounter'
import {type TableRelease} from './ReleasesOverview'

const ReleaseTime = ({release}: {release: TableRelease}) => {
  const {t} = useTranslation()
  const {timeZone, utcToCurrentZoneDate} = useTimeZone()
  const {abbreviation: localeTimeZoneAbbreviation} = getLocalTimeZone()

  const {metadata} = release

  const getTimezoneAbbreviation = useCallback(
    () =>
      timeZone.abbreviation === localeTimeZoneAbbreviation ? '' : `(${timeZone.abbreviation})`,
    [localeTimeZoneAbbreviation, timeZone.abbreviation],
  )

  const timeString = useMemo(() => {
    if (metadata.releaseType === 'asap') {
      return t('release.type.asap')
    }
    if (metadata.releaseType === 'undecided') {
      return t('release.type.undecided')
    }

    const publishDate = getPublishDateFromRelease(release)

    return publishDate
      ? `${format(utcToCurrentZoneDate(publishDate), 'PPpp')} ${getTimezoneAbbreviation()}`
      : null
  }, [metadata.releaseType, release, utcToCurrentZoneDate, getTimezoneAbbreviation, t])

  return (
    <Text muted size={1}>
      {timeString}
    </Text>
  )
}

const ReleaseNameCell: Column<TableRelease>['cell'] = ({cellProps, datum: release}) => {
  const router = useRouter()
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const {selectedReleaseId, setPerspective} = usePerspective()
  const {state} = release
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
  const isArchived = state === 'archived'
  const isReleasePinned = releaseId === selectedReleaseId

  const handlePinRelease = useCallback(() => {
    if (isReleasePinned) {
      setPerspective('drafts')
    } else {
      setPerspective(releaseId)
    }
  }, [isReleasePinned, releaseId, setPerspective])

  const cardProps: TableRowProps = release.isDeleted
    ? {tone: 'transparent'}
    : {
        as: 'a',
        // navigate to release detail
        onClick: () => router.navigate({releaseId: releaseId}),
        tone: 'inherit',
      }

  const pinButtonIcon = isReleasePinned ? PinFilledIcon : PinIcon
  const displayTitle = release.metadata.title || tCore('release.placeholder-untitled-release')

  return (
    <Box {...cellProps} marginLeft={3} flex={1} paddingY={1} paddingRight={2} sizing={'border'}>
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
            data-testid="pin-release-button"
            onClick={handlePinRelease}
            padding={2}
            round
            selected={isReleasePinned}
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
      style: {minWidth: '50%', maxWidth: '50%'},
      header: ({headerProps}) => (
        <Flex
          {...headerProps}
          flex={1}
          marginLeft={3}
          paddingRight={2}
          paddingY={3}
          sizing="border"
        >
          <Headers.BasicHeader text={t('table-header.title')} />
        </Flex>
      ),
      cell: ReleaseNameCell,
    },
    {
      id: 'publishAt',
      sorting: true,
      sortTransform: (release) => {
        if (release.metadata.releaseType === 'undecided') return Infinity

        const publishDate = getPublishDateFromRelease(release)

        if (release.metadata.releaseType === 'asap' || !publishDate) return 0
        return new Date(publishDate).getTime()
      },
      width: 250,
      header: (props) => (
        <Flex {...props.headerProps} paddingY={3} sizing="border">
          <Headers.SortHeaderButton text={t('table-header.time')} {...props} />
        </Flex>
      ),
      cell: ({cellProps, datum: release}) => (
        <Flex {...cellProps} align="center" paddingX={2} paddingY={3} gap={2} sizing="border">
          <ReleaseTime release={release} />
          {isReleaseScheduledOrScheduling(release) && (
            <Text size={1} data-testid="release-lock-icon">
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

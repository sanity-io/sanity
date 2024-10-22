import {PinFilledIcon, PinIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {format} from 'date-fns'
import {useCallback} from 'react'
import {ReleaseAvatar, type TFunction, Translate, usePerspective, useTranslation} from 'sanity'
import {useRouter} from 'sanity/router'

import {Button, Tooltip} from '../../../../ui-components'
import {RelativeTime} from '../../../components'
import {releasesLocaleNamespace} from '../../i18n'
import {getReleaseTone} from '../../util/getReleaseTone'
import {type TableRowProps} from '../components/Table/Table'
import {Headers} from '../components/Table/TableHeader'
import {type Column} from '../components/Table/types'
import {ReleaseDocumentsCounter} from './ReleaseDocumentsCounter'
import {type TableRelease} from './ReleasesOverview'

const ReleaseTime = ({release}: {release: TableRelease}) => {
  const {t: tCore} = useTranslation()
  const {publishedAt, releaseType} = release

  const getTimeString = () => {
    if (releaseType === 'asap') {
      return tCore('release.type.asap')
    }
    if (releaseType === 'undecided') {
      return tCore('release.type.undecided')
    }

    return publishedAt ? format(new Date(publishedAt), 'PPpp') : null
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
  const {currentGlobalBundle: currentGlobalRelease, setPerspective} = usePerspective()
  const {archived, _id, publishedAt} = release

  const handlePinRelease = useCallback(() => {
    if (_id === currentGlobalRelease._id) {
      setPerspective('drafts')
    } else {
      setPerspective(_id)
    }
  }, [_id, currentGlobalRelease._id, setPerspective])

  const cardProps: TableRowProps = release.isDeleted
    ? {tone: 'transparent'}
    : {
        as: 'a',
        // navigate to release detail
        onClick: () => router.navigate({releaseId: release._id}),
        tone: 'inherit',
      }

  const isReleasePinned = _id === currentGlobalRelease._id
  const pinButtonIcon = isReleasePinned ? PinFilledIcon : PinIcon

  return (
    <Box {...cellProps} marginLeft={3} flex={1} padding={1}>
      <Tooltip
        disabled={!release.isDeleted}
        content={
          <Text size={1}>
            <Translate t={t} i18nKey="deleted-release" values={{title: release.title}} />
          </Text>
        }
      >
        <Flex align="center" gap={4}>
          <Button
            tooltipProps={{
              disabled: archived || publishedAt !== undefined,
              content: t('dashboard.details.pin-release'),
            }}
            disabled={archived || publishedAt !== undefined}
            icon={pinButtonIcon}
            mode="bleed"
            onClick={handlePinRelease}
            padding={2}
            round
            selected={_id === currentGlobalRelease._id}
          />
          <Card {...cardProps} padding={2} radius={2} flex={1}>
            <Flex align="center" gap={2}>
              <Box flex="none">
                <ReleaseAvatar tone={getReleaseTone(release)} />
              </Box>
              <Stack flex={1} space={2}>
                <Flex align="center" gap={2}>
                  <Text size={1} weight="medium">
                    {release.title}
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
      header: ({headerProps}) => (
        <Flex {...headerProps} flex={1} marginLeft={3} paddingY={3} sizing="border">
          <Box padding={2}>
            <Text muted size={1} weight="medium">
              {t('table-header.title')}
            </Text>
          </Box>
        </Flex>
      ),
      cell: ReleaseNameCell,
    },
    {
      id: 'publishedAt',
      sorting: true,
      width: 100,
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
        <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
          {!!release.publishedAt && <ReleaseTime release={release} />}
        </Flex>
      ),
    },
    {
      id: 'documentsMetadata.updatedAt',
      sorting: true,
      width: 100,
      header: (props) => (
        <Flex {...props.headerProps} paddingY={3} sizing="border">
          <Headers.SortHeaderButton text={t('table-header.edited')} {...props} />
        </Flex>
      ),
      cell: ({datum: {documentsMetadata}, cellProps}) => (
        <Flex {...cellProps} align="center" gap={2} paddingX={2} paddingY={3} sizing="border">
          {!!documentsMetadata?.updatedAt && (
            <Text muted size={1}>
              <RelativeTime time={documentsMetadata.updatedAt} useTemporalPhrase minimal />
            </Text>
          )}
        </Flex>
      ),
    },
    {
      id: 'documentCount',
      sorting: false,
      width: 90,
      header: ({headerProps}) => (
        <Flex {...headerProps} paddingY={3} sizing="border">
          <Box padding={2} />
        </Flex>
      ),
      cell: ({datum: {isDeleted, documentsMetadata}, cellProps}) => (
        <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
          {!isDeleted && <ReleaseDocumentsCounter releaseDocumentMetadata={documentsMetadata} />}
        </Flex>
      ),
    },
  ]
}

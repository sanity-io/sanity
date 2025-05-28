import {ErrorOutlineIcon, LockIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import {type TFunction} from 'i18next'
import {Fragment} from 'react'

import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {RelativeTime} from '../../../components'
import {getPublishDateFromRelease, isReleaseScheduledOrScheduling} from '../../util/util'
import {ReleaseTime} from '../components/ReleaseTime'
import {Headers} from '../components/Table/TableHeader'
import {type Column} from '../components/Table/types'
import {ReleaseDocumentsCounter} from './columnCells/ReleaseDocumentsCounter'
import {ReleaseNameCell} from './columnCells/ReleaseName'
import {type Mode} from './queryParamUtils'
import {type TableRelease} from './ReleasesOverview'

const enableColumnFormMode =
  (currentMode: Mode) => (column: Column<TableRelease>, expectedMode: Mode | 'all') => {
    if (!currentMode) throw new Error('currentMode is required')
    if (expectedMode === 'all' || expectedMode === currentMode) {
      return column
    }
    return undefined
  }

export const releasesOverviewColumnDefs: (
  t: TFunction<'releases', undefined>,
  releaseGroupMode: Mode,
) => Column<TableRelease>[] = (t, releaseGroupMode) => {
  const checkColumnMode = enableColumnFormMode(releaseGroupMode)
  return [
    checkColumnMode(
      {
        id: 'metadata.title',
        sorting: true,
        width: null,
        style: {minWidth: '50%', maxWidth: '50%'},
        header: (props) => (
          <Flex
            {...props.headerProps}
            flex={1}
            paddingLeft={6}
            width={3}
            paddingRight={2}
            paddingY={3}
            sizing="border"
          >
            <Headers.SortHeaderButton {...props} text={t('table-header.title')} />
          </Flex>
        ),
        cell: ReleaseNameCell,
      },
      'all',
    ),
    checkColumnMode(
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
        cell: ({cellProps, datum: release}) => {
          if (release.isLoading) return null

          return (
            <Flex {...cellProps} align="center" paddingX={2} paddingY={3} gap={2} sizing="border">
              <Text muted size={1}>
                <ReleaseTime release={release} />
              </Text>
              {isReleaseScheduledOrScheduling(release) && (
                <Text size={1} data-testid="release-lock-icon">
                  <LockIcon />
                </Text>
              )}
            </Flex>
          )
        },
      },
      'active',
    ),
    // This is a hidden column only used for sorting when
    // no other sort column is selected (the default state)
    checkColumnMode(
      {
        id: 'lastActivity',
        hidden: true,
        sorting: true,
        width: 100,
        sortTransform: ({publishedAt, _updatedAt}) => {
          // the default sort is always descending, so -Infinity pushes missing values to end
          const lastActivity = publishedAt ?? _updatedAt

          return lastActivity ? new Date(lastActivity).getTime() : -Infinity
        },
      },
      'archived',
    ),
    checkColumnMode(
      {
        id: 'publishedAt',
        sorting: true,
        sortTransform: (release, direction) => {
          if (release.state !== 'published') {
            if (direction === 'asc') return Infinity
            return -Infinity
          }
          if (!release.publishedAt) return release._updatedAt
          return new Date(release.publishedAt).getTime()
        },
        width: 250,
        header: (props) => (
          <Flex {...props.headerProps} paddingY={3} sizing="border">
            <Headers.SortHeaderButton text={t('table-header.publishedAt')} {...props} />
          </Flex>
        ),
        cell: ({cellProps, datum: release}) => (
          <Flex {...cellProps} align="center" paddingX={2} paddingY={3} gap={2} sizing="border">
            <Text muted size={1}>
              {release.publishedAt ? (
                // Assuming releases are not updated after archiving.
                // If we realize this is miss leading for customers and they have edited the release after archiving
                // we can use the history endpoint to get the archived change.
                <RelativeTime time={release.publishedAt} useTemporalPhrase minimal />
              ) : (
                '-'
              )}
            </Text>
          </Flex>
        ),
      },
      'archived',
    ),
    checkColumnMode(
      {
        id: '_updatedAt',
        sorting: true,
        sortTransform: (release, direction) => {
          if (release.state !== 'archived') {
            if (direction === 'asc') return Infinity
            return -Infinity
          }

          return new Date(release._updatedAt).getTime()
        },
        width: 250,
        header: (props) => (
          <Flex {...props.headerProps} paddingY={3} sizing="border">
            <Headers.SortHeaderButton text={t('table-header.archivedAt')} {...props} />
          </Flex>
        ),
        cell: ({cellProps, datum: release}) => (
          <Flex {...cellProps} align="center" paddingX={2} paddingY={3} gap={2} sizing="border">
            <Text muted size={1}>
              {release.state === 'archived' ? (
                // Assuming releases are not updated after archiving.
                // If we later realize this is miss leading for customers and they have edited the release after archiving
                // we can use the history endpoint to get the archived change.
                <RelativeTime time={release._updatedAt} useTemporalPhrase minimal />
              ) : (
                '-'
              )}
            </Text>
          </Flex>
        ),
      },
      'archived',
    ),
    checkColumnMode(
      {
        id: 'documentsMetadata.updatedAt',
        sorting: true,
        width: 150,
        header: (props) => (
          <Flex {...props.headerProps} paddingY={3} sizing="border">
            <Headers.SortHeaderButton text={t('table-header.edited')} {...props} />
          </Flex>
        ),
        cell: ({datum: {documentsMetadata, _updatedAt}, cellProps}) => {
          const updatedAtDate = documentsMetadata?.updatedAt ?? _updatedAt
          return (
            <Flex {...cellProps} align="center" gap={2} paddingX={2} paddingY={3} sizing="border">
              <Text muted size={1}>
                {updatedAtDate ? (
                  <RelativeTime time={updatedAtDate} useTemporalPhrase minimal />
                ) : (
                  '-'
                )}
              </Text>
            </Flex>
          )
        },
      },
      'active',
    ),
    checkColumnMode(
      {
        id: 'error',
        sorting: false,
        width: 40,
        header: () => <Fragment />,
        cell: ({datum: {error, state}, cellProps}) => (
          <Flex
            {...cellProps}
            align="center"
            paddingX={2}
            paddingY={3}
            sizing="border"
            data-testid="error-indicator"
          >
            {typeof error !== 'undefined' && state === 'active' && (
              <Tooltip content={<Text size={1}>{t('failed-publish-title')}</Text>} portal>
                <Text size={1}>
                  <ToneIcon icon={ErrorOutlineIcon} tone="critical" />
                </Text>
              </Tooltip>
            )}
          </Flex>
        ),
      },
      'all',
    ),
    checkColumnMode(
      {
        id: 'documentCount',
        sorting: false,
        width: 120,
        header: ({headerProps}) => (
          <Flex {...headerProps} paddingY={3} sizing="border">
            <Headers.BasicHeader text={t('table-header.documents')} />
          </Flex>
        ),
        cell: ({datum: {isDeleted, state, finalDocumentStates, documentsMetadata}, cellProps}) => (
          <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
            {!isDeleted && (
              <ReleaseDocumentsCounter
                documentCount={
                  state === 'archived' || state === 'published'
                    ? finalDocumentStates?.length
                    : documentsMetadata?.documentCount
                }
              />
            )}
          </Flex>
        ),
      },
      'all',
    ),
  ].filter(Boolean) as Column<TableRelease>[]
}

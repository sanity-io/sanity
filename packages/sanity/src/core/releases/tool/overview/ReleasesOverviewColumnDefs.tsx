import {ErrorOutlineIcon, LockIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import {type TFunction} from 'i18next'
import {Fragment} from 'react'

import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {RelativeTime} from '../../../components'
import {getPublishDateFromRelease, isReleaseScheduledOrScheduling} from '../../util/util'
import {Headers} from '../components/Table/TableHeader'
import {type Column} from '../components/Table/types'
import {ReleaseDocumentsCounter} from './columnCells/ReleaseDocumentsCounter'
import {ReleaseNameCell} from './columnCells/ReleaseName'
import {ReleaseTime} from './columnCells/useReleaseTime'
import {type TableRelease} from './ReleasesOverview'

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
          <Text muted size={1}>
            <ReleaseTime release={release} />
          </Text>
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
    {
      id: 'documentCount',
      sorting: false,
      width: 120,
      header: ({headerProps}) => (
        <Flex {...headerProps} paddingY={3} sizing="border">
          <Headers.BasicHeader text="" />
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
  ]
}

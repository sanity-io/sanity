import {LockIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import {type TFunction} from 'i18next'

import {RelativeTime} from '../../../components'
import {getPublishDateFromRelease, isReleaseScheduledOrScheduling} from '../../util/util'
import {Headers} from '../components/Table/TableHeader'
import {type Column} from '../components/Table/types'
import {ReleaseDocumentsCounter} from './columnCells/ReleaseDocumentsCounter'
import {ReleaseNameCell} from './columnCells/ReleaseName'
import {ReleaseTime} from './columnCells/ReleaseTime'
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

import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useRouter} from 'sanity/router'

import {Tooltip} from '../../../../ui-components'
import {BundleBadge} from '../../../bundles'
import {RelativeTime, UserAvatar} from '../../../components'
import {type TableRowProps} from '../../components/Table/Table'
import {Headers} from '../../components/Table/TableHeader'
import {type Column} from '../../components/Table/types'
import {type TableBundle} from './ReleasesOverview'

const ReleaseNameCell: Column<TableBundle>['cell'] = ({cellProps, datum: bundle}) => {
  const router = useRouter()

  const cardProps: TableRowProps = bundle.isDeleted
    ? {tone: 'transparent'}
    : {
        as: 'a',
        // navigate to bundle detail
        onClick: () => router.navigate({bundleSlug: bundle.slug}),
      }

  return (
    <Box {...cellProps} flex={1} padding={1}>
      <Tooltip
        disabled={!bundle.isDeleted}
        content={
          <Text size={1}>
            '<strong>{bundle.title}</strong>' has been deleted
          </Text>
        }
      >
        <Card {...cardProps} padding={2} radius={2}>
          <Flex align="center" gap={2}>
            <Box flex="none">
              <BundleBadge hue={bundle.hue} icon={bundle.icon} />
            </Box>
            <Stack flex={1} space={2}>
              <Flex align="center" gap={2}>
                <Text size={1} weight="medium">
                  {bundle.title}
                </Text>
              </Flex>
            </Stack>
          </Flex>
        </Card>
      </Tooltip>
    </Box>
  )
}

export const releasesOverviewColumnDefs: Column<TableBundle>[] = [
  {
    id: 'search',
    sorting: false,
    width: null,
    header: (props) => <Headers.TableHeaderSearch {...props} placeholder="Search releases" />,
    cell: ReleaseNameCell,
  },
  {
    id: 'documentCount',
    sorting: false,
    width: 90,
    header: ({headerProps}) => (
      <Flex {...headerProps} paddingY={3} sizing="border">
        <Box padding={2}>
          <Text muted size={1} weight="medium">
            Documents
          </Text>
        </Box>
      </Flex>
    ),
    cell: ({datum: {documentsMetadata}, cellProps}) => (
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
        <Text muted size={1}>
          {documentsMetadata?.documentCount || 0}
        </Text>
      </Flex>
    ),
  },
  {
    id: '_createdAt',
    sorting: true,
    width: 120,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.SortHeaderButton text="Created" {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum: bundle}) => (
      <Flex {...cellProps} align="center" gap={2} paddingX={2} paddingY={3} sizing="border">
        {!!bundle.authorId && <UserAvatar size={0} user={bundle.authorId} />}
        <Text muted size={1}>
          <RelativeTime time={bundle._createdAt} useTemporalPhrase minimal />
        </Text>
      </Flex>
    ),
  },
  {
    id: 'documentsMetadata.updatedAt',
    sorting: true,
    width: 100,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.SortHeaderButton text="Edited" {...props} />
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
    id: 'publishedAt',
    sorting: true,
    width: 100,
    header: (props) => (
      <Flex {...props.headerProps} align="center" gap={1} paddingX={1} paddingY={0} sizing="border">
        <Headers.SortHeaderButton text="Published" {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum: bundle}) => (
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
        {!!bundle.publishedAt && (
          <Text muted size={1}>
            <RelativeTime time={bundle.publishedAt} useTemporalPhrase minimal />
          </Text>
        )}
      </Flex>
    ),
  },
]

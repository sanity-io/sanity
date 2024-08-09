import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type TFunction} from 'sanity'
import {useRouter} from 'sanity/router'

import {BundleBadge} from '../../../bundles'
import {RelativeTime, UserAvatar} from '../../../components'
import {Headers} from '../../components/Table/TableHeader'
import {type Column} from '../../components/Table/types'
import {type TableBundle} from './ReleasesOverview'

const ReleaseNameCell: Column<TableBundle>['cell'] = ({cellProps, datum: bundle}) => {
  const router = useRouter()

  return (
    <Box {...cellProps} flex={1} padding={1}>
      <Card
        as="a"
        // navigate to bundle detail
        // eslint-disable-next-line react/jsx-no-bind
        onClick={() => router.navigate({bundleSlug: bundle.slug})}
        padding={2}
        radius={2}
      >
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
    </Box>
  )
}

export const releasesOverviewColumnDefs: (
  t: TFunction<'releases', undefined>,
) => Column<TableBundle>[] = (t) => {
  return [
    {
      id: 'search',
      sorting: false,
      width: null,
      header: (props) => (
        <Headers.TableHeaderSearch
          {...props}
          placeholder={t('overview.search-releases-placeholder')}
        />
      ),
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
              {t('table-header.documents')}
            </Text>
          </Box>
        </Flex>
      ),
      cell: ({datum: {documentsMetadata}, cellProps}) => (
        <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
          <Text muted size={1}>
            {documentsMetadata.documentCount}
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
          <Headers.SortHeaderButton text={t('table-header.created')} {...props} />
        </Flex>
      ),
      cell: ({cellProps, datum: bundle}) => (
        <Flex {...cellProps} align="center" gap={2} paddingX={2} paddingY={3} sizing="border">
          {bundle.authorId && <UserAvatar size={0} user={bundle.authorId} />}
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
          <Headers.SortHeaderButton text={t('table-header.edited')} {...props} />
        </Flex>
      ),
      cell: ({datum: {documentsMetadata}, cellProps}) => (
        <Flex {...cellProps} align="center" gap={2} paddingX={2} paddingY={3} sizing="border">
          {documentsMetadata.updatedAt && (
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
        <Flex
          {...props.headerProps}
          align="center"
          gap={1}
          paddingX={1}
          paddingY={0}
          sizing="border"
        >
          <Headers.SortHeaderButton text={t('table-header.published')} {...props} />
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
}

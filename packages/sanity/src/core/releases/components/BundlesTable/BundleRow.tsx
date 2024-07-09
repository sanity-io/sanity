import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useRouter} from 'sanity/router'

import {BundleBadge} from '../../../bundles/components/BundleBadge'
import {RelativeTime} from '../../../components'
import {BundleMenuButton} from '../BundleMenuButton/BundleMenuButton'
import {type TableBundle} from './BundlesTable'

type Props = {
  bundle: TableBundle
}

export function BundleRow({bundle}: Props) {
  const router = useRouter()

  return (
    <Card data-testid="bundle-row" as="tr" border radius={3} display="flex" margin={-1}>
      {/* Title */}
      <Box as="td" flex={1} padding={1}>
        <Card
          as="a"
          // navigate to bundle detail
          onClick={() => router.navigate({bundleId: bundle._id})}
          padding={2}
          radius={2}
        >
          <Flex align="center" gap={2}>
            <Box flex="none">
              <BundleBadge tone={bundle.tone} icon={bundle.icon} />
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
      {/* Published */}
      <Flex as="td" align="center" paddingX={2} paddingY={3} sizing="border" style={{width: 100}}>
        {!!bundle.publishedAt && (
          <Text muted size={1}>
            <RelativeTime time={bundle.publishedAt} />
          </Text>
        )}
      </Flex>
      {/* # of documents */}
      <Flex as="td" align="center" paddingX={2} paddingY={3} sizing="border" style={{width: 90}}>
        <Text muted size={1}>
          {bundle.matches}
        </Text>
      </Flex>
      {/* Edited */}
      <Flex
        as="td"
        align="center"
        gap={2}
        paddingX={2}
        paddingY={3}
        sizing="border"
        style={{width: 100}}
      >
        {bundle.lastEdited && (
          <Text muted size={1}>
            <RelativeTime time={bundle.lastEdited} />
          </Text>
        )}
      </Flex>
      {/* Actions */}
      <Flex as="td" align="center" flex="none" padding={3}>
        <BundleMenuButton bundle={bundle} />
      </Flex>
    </Card>
  )
}

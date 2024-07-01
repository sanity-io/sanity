import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useRouter} from 'sanity/router'

import {type BundleDocument} from '../../../store/bundles/types'
import {VersionIcon} from '../../../versions/components/VersionIcon'
import {shortRelativeDate} from '../../utils/shortRelativeDate'
import {BundleMenuButton} from '../BundleMenuButton/BundleMenuButton'

type Props = {
  bundle: BundleDocument
}

export function BundleRow({bundle}: Props) {
  const router = useRouter()

  return (
    <Card data-testid="bundle-row" as="tr" border radius={3} display="flex" margin={-1}>
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
              <VersionIcon tone={bundle.tone} icon={bundle.icon} />
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
      {/* Scheduled */}
      <Flex as="td" align="center" paddingX={2} paddingY={3} sizing="border" style={{width: 100}}>
        {!!bundle.publishAt && (
          <Text muted size={1}>
            {shortRelativeDate(bundle.publishAt)}
          </Text>
        )}
      </Flex>
      <Flex align="center" flex="none" padding={3}>
        <BundleMenuButton bundle={bundle} />
      </Flex>
    </Card>
  )
}

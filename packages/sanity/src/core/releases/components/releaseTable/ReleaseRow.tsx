import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useRouter} from 'sanity/router'

import {ReleaseIcon} from '../../../../structure/panes/document/versions/ReleaseIcon'
import {type Version} from '../../../util/versions/util'
import {shortRelativeDate} from '../../utils/shortRelativeDate'

type Props = {
  release: Version
}

export function ReleaseRow({release}: Props) {
  const router = useRouter()

  return (
    <Card as="tr" border radius={3} display="flex" margin={-1}>
      <Box as="td" flex={1} padding={1}>
        <Card
          as="a"
          // navigate to release detail
          onClick={() => router.navigate({releaseId: release.name})}
          padding={2}
          radius={2}
        >
          <Flex align="center" gap={2}>
            <Box flex="none">
              <ReleaseIcon hue={release.hue} icon={release.icon} />
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
      </Box>
      {/* Scheduled */}
      <Flex as="td" align="center" paddingX={2} paddingY={3} sizing="border" style={{width: 100}}>
        {release.publishAt && (
          <Text muted size={1}>
            {shortRelativeDate(release.publishAt)}
          </Text>
        )}
      </Flex>
    </Card>
  )
}

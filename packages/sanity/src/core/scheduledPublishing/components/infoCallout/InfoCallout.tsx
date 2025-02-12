import {InfoOutlineIcon} from '@sanity/icons'
import {Card, Flex, Inline, Stack, Text} from '@sanity/ui'

import {RELEASES_DOCS_URL} from '../../constants'

// TODO: TBC with design and growth

const InfoCallout = () => {
  return (
    <Card overflow="hidden" padding={4} radius={2} shadow={1} tone="suggest">
      <Flex align="center" gap={4}>
        <Text size={2}>
          <InfoOutlineIcon />
        </Text>
        <Inline space={3}>
          <Text size={1} weight="semibold">
            Schedule Publishing is not enabled
          </Text>
          <Stack space={3} marginTop={2}>
            <Text size={1}>
              We recommend using{' '}
              <a target="_blank" href={RELEASES_DOCS_URL} rel="noreferrer">
                Releases
              </a>
              .
            </Text>

            <Text size={1}>
              Scheduled Publishing is not enabled by default. It can be enabled in the config by
              setting <code>scheduledPublishing.enabled = true</code>
            </Text>
            <Text size={1}>
              <a
                target="_blank"
                href={'https://www.sanity.io/docs/scheduled-publishing'}
                rel="noreferrer"
              >
                Read the docs
              </a>
            </Text>
          </Stack>
        </Inline>
      </Flex>
    </Card>
  )
}

export default InfoCallout

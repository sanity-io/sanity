import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Card} from '@sanity/ui'
import {Text, Flex, VStack, Icon} from 'ui5'

import {RELEASES_DOCS_URL} from '../../constants'

// TODO: TBC with design and growth

const InfoCallout = () => {
  return (
    <Card overflow="hidden" padding={4} radius={2} shadow={1} tone="suggest">
      <Flex alignItems="center" gap={4}>
        <Icon icon={InfoOutlineIcon} size={2} tone="suggest" style={{flexShrink: 0}} />
        <VStack gap={4}>
          <Text size={1} weight="semibold" as="div" trim={true} tone="suggest">
            Schedule Publishing is not enabled
          </Text>
          <VStack gap={3}>
            <Text size={1} as="div" trim={true} tone="suggest">
              We recommend using{' '}
              <a target="_blank" href={RELEASES_DOCS_URL} rel="noreferrer">
                Releases
              </a>
              .
            </Text>

            <Text size={1} as="div" trim={true} tone="suggest">
              Scheduled Publishing is not enabled by default. It can be enabled in the config by
              setting <code>scheduledPublishing.enabled = true</code>
            </Text>
            <Text size={1} as="div" trim={true} tone="suggest">
              <a
                target="_blank"
                href={'https://www.sanity.io/docs/scheduled-publishing'}
                rel="noreferrer"
              >
                Read the docs
              </a>
            </Text>
          </VStack>
        </VStack>
      </Flex>
    </Card>
  )
}

export default InfoCallout

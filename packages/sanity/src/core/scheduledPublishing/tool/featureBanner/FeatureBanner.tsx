import {InfoOutlineIcon} from '@sanity/icons'
import {Card, Flex, Text} from '@sanity/ui'

import {FEATURE_NOT_SUPPORTED_TEXT} from '../../constants'
import useCheckFeature from '../../hooks/useCheckFeature'

const FeatureBanner = () => {
  // Check if the current project supports Scheduled Publishing
  const hasFeature = useCheckFeature()

  if (hasFeature === false) {
    return (
      <Card padding={4} tone="caution">
        <Flex align="center" gap={3}>
          <Text size={2}>
            <InfoOutlineIcon />
          </Text>
          <Text size={1}>{FEATURE_NOT_SUPPORTED_TEXT}</Text>
        </Flex>
      </Card>
    )
  }

  return null
}

export default FeatureBanner

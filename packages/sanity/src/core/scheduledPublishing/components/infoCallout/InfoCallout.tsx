import {InfoOutlineIcon} from '@sanity/icons'
import {Card, Flex, Inline, Text} from '@sanity/ui'

interface Props {
  description?: string | React.ReactNode
  title: string | React.ReactNode
}

const InfoCallout = (props: Props) => {
  const {description, title} = props

  return (
    <Card overflow="hidden" padding={4} radius={2} shadow={1} tone="suggest">
      <Flex align="center" gap={4}>
        <Text size={2}>
          <InfoOutlineIcon />
        </Text>
        <Inline space={3}>
          <Text size={1} weight="semibold">
            {title}
          </Text>
          {description && <Text size={1}>{description}</Text>}
        </Inline>
      </Flex>
    </Card>
  )
}

export default InfoCallout

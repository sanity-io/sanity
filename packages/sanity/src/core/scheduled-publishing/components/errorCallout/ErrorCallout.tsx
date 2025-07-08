import {ErrorOutlineIcon} from '@sanity/icons'
import {Card, Flex, Inline, Text} from '@sanity/ui'

interface Props {
  description?: string
  title: string
}

const ErrorCallout = (props: Props) => {
  const {description, title} = props

  return (
    <Card overflow="hidden" padding={4} radius={2} shadow={1} tone="critical">
      <Flex align="center" gap={4}>
        <Text size={2}>
          <ErrorOutlineIcon />
        </Text>
        <Inline space={2}>
          <Text size={1} weight="semibold">
            {title}
          </Text>
          {description && <Text size={1}>{description}</Text>}
        </Inline>
      </Flex>
    </Card>
  )
}

export default ErrorCallout

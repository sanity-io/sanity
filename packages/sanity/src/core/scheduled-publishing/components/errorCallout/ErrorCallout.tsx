import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Card, Inline} from '@sanity/ui'
import {Text, Flex, Icon} from 'ui5'

interface Props {
  description?: string
  title: string
}

const ErrorCallout = (props: Props) => {
  const {description, title} = props

  return (
    <Card overflow="hidden" padding={4} radius={2} shadow={1} tone="critical">
      <Flex alignItems="center" gap={4}>
        <Icon icon={ErrorOutlineIcon} size={2} tone="critical" />
        <Inline gap={2}>
          <Text size={1} weight="semibold" as="div" trim={true} tone="critical">
            {title}
          </Text>
          {description && (
            <Text size={1} as="div" trim={true} tone="critical">
              {description}
            </Text>
          )}
        </Inline>
      </Flex>
    </Card>
  )
}

export default ErrorCallout

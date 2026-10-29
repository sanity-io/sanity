import {CalendarIcon} from '@sanity/icons/Calendar'
import {Inline} from '@sanity/ui'
import {Text, Flex} from 'ui5'

interface Props {
  body?: string
  title: string
}

const ToastDescription = (props: Props) => {
  const {body, title} = props
  return (
    <Flex paddingY={1} gap={3} flexDirection="column">
      <Inline gap={2}>
        <CalendarIcon />
        {title && (
          <Text size={2} weight="semibold" as="div" trim={true}>
            {title}
          </Text>
        )}
      </Inline>
      {body && (
        <Text size={1} as="div" trim={true}>
          {body}
        </Text>
      )}
    </Flex>
  )
}

export default ToastDescription

import {CalendarIcon} from '@sanity/icons'
import {Inline, Stack, Text} from '@sanity/ui'

interface Props {
  body?: string
  title: string
}

const ToastDescription = (props: Props) => {
  const {body, title} = props
  return (
    <Stack paddingY={1} space={3}>
      <Inline space={2}>
        <CalendarIcon />
        {title && (
          <Text size={2} weight="semibold">
            {title}
          </Text>
        )}
      </Inline>
      {body && <Text size={1}>{body}</Text>}
    </Stack>
  )
}

export default ToastDescription

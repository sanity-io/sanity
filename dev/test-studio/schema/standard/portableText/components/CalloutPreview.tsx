import {Box, Card, type CardTone, Flex, Text} from '@sanity/ui'
import {type PreviewProps} from 'sanity'

export function CalloutPreview(props: PreviewProps) {
  const tone = props.tone || 'default'

  return (
    <Card tone={tone as CardTone}>
      <Flex align="flex-start">
        <Box flex={1} padding={3}>
          <Text size={1} weight="semibold">
            {props.title || <>Untitled</>} ({tone})
          </Text>
          {props.subtitle && (
            <Text muted size={1}>
              {props.subtitle}
            </Text>
          )}
        </Box>
        <div>{props.actions}</div>
      </Flex>
    </Card>
  )
}

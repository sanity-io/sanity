import {Box, Card, type CardTone, Flex, Text} from '@sanity/ui'
import {type PreviewProps} from 'sanity'

export function CalloutPreview(props: PreviewProps & {tone?: CardTone}) {
  const tone = props.tone || 'default'

  return (
    <Card tone={tone}>
      <Flex align="flex-start">
        <Box flex={1} padding={3}>
          <Text size={1} weight="semibold">
            {(props.title as any) || <>Untitled</>} ({tone})
          </Text>
          {props.subtitle && (
            <Text muted size={1}>
              {props.subtitle as any}
            </Text>
          )}
        </Box>
        <div>{props.actions as any}</div>
      </Flex>
    </Card>
  )
}

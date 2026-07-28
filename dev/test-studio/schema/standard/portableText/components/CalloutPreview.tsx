import {Box, Card, type CardTone, Flex, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {type PreviewProps} from 'sanity'

type CalloutPreviewProps = PreviewProps & {
  tone?: CardTone | string
}

export function CalloutPreview(props: CalloutPreviewProps) {
  const tone = (props.tone || 'default') as CardTone

  return (
    <Card tone={tone}>
      <Flex align="flex-start">
        <Box flex={1} padding={3}>
          <Text size={1} weight="semibold">
            {(props.title as ReactNode) || <>Untitled</>} ({tone})
          </Text>
          {props.subtitle ? (
            <Text muted size={1}>
              {props.subtitle as ReactNode}
            </Text>
          ) : null}
        </Box>
        <div>{props.actions as ReactNode}</div>
      </Flex>
    </Card>
  )
}

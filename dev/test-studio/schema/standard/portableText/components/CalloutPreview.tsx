import {Box, Card, type CardTone, Flex, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {type PreviewProps} from 'sanity'

interface CalloutPreviewProps extends PreviewProps {
  tone?: CardTone
}

export function CalloutPreview(props: CalloutPreviewProps) {
  const tone = props.tone || 'default'

  return (
    <Card tone={tone}>
      <Flex align="flex-start">
        <Box flex={1} padding={3}>
          <Text size={1} weight="semibold">
            {(props.title as ReactNode) || <>Untitled</>} ({tone})
          </Text>
          {props.subtitle && (
            <Text muted size={1}>
              {props.subtitle as ReactNode}
            </Text>
          )}
        </Box>
        <div>{props.actions as ReactNode}</div>
      </Flex>
    </Card>
  )
}

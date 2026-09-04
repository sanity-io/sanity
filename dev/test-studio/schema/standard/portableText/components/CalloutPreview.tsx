import {Card, type CardTone, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {type PreviewProps} from 'sanity'
import {Flex, Box} from 'ui5'

type CalloutPreviewProps = PreviewProps & {
  tone?: CardTone | string
}

export function CalloutPreview(props: CalloutPreviewProps) {
  const tone = (props.tone || 'default') as CardTone

  return (
    <Card tone={tone}>
      <Flex alignItems="flex-start">
        <Box flexBasis="0%" flexGrow={1} padding={3}>
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

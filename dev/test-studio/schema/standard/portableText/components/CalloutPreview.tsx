import {Card, type CardTone} from '@sanity/ui'
import {type ReactNode} from 'react'
import {type PreviewProps} from 'sanity'
import {Text, Flex, Box} from 'ui5'

type CalloutPreviewProps = PreviewProps & {
  tone?: CardTone | string
}

export function CalloutPreview(props: CalloutPreviewProps) {
  const tone = (props.tone || 'default') as CardTone

  return (
    <Card tone={tone}>
      <Flex alignItems="flex-start">
        <Box flexBasis="0%" flexGrow={1} padding={3}>
          <Text
            size={1}
            weight="semibold"
            as="div"
            trim={true}
            style={{color: 'var(--card-fg-color)'}}
          >
            {(props.title as ReactNode) || <>Untitled</>} ({tone})
          </Text>
          {props.subtitle ? (
            <Text muted size={1} as="div" trim={true} style={{color: 'var(--card-muted-fg-color)'}}>
              {props.subtitle as ReactNode}
            </Text>
          ) : null}
        </Box>
        <div>{props.actions as ReactNode}</div>
      </Flex>
    </Card>
  )
}

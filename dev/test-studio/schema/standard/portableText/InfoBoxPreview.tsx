import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Text, Flex, Box, Icon} from 'ui5'

interface InfoBoxPreviewProps {
  value?: {_type: 'infobox'; body: unknown[]; title: string}
}

export function InfoBoxPreview(props: InfoBoxPreviewProps) {
  const {value} = props
  const {body, title} = value || {}

  if (!body) {
    return (
      <Flex alignItems="center" height="100%">
        <Box flexBasis="0%" flexGrow={1} padding={3}>
          <Text muted size={1} truncate={1} as="div" trim={true}>
            The info box content is empty 😿
          </Text>
        </Box>
      </Flex>
    )
  }

  return (
    <Flex alignItems="flex-start" height="100%">
      <Box padding={3} paddingRight={0}>
        <Icon size={1} icon={InfoOutlineIcon} style={{margin: '-0.375rem'}} />
      </Box>
      <Box flexBasis="0%" flexGrow={1} padding={3}>
        <Text size={1} truncate={1} weight="semibold" as="div" trim={true}>
          {title || <>Untitled</>}
        </Text>
      </Box>
    </Flex>
  )
}

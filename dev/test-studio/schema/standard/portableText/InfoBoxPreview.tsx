import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Text} from '@sanity/ui'
import {Flex, Box} from 'ui5'

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
          <Text muted size={1} textOverflow="ellipsis">
            The info box content is empty 😿
          </Text>
        </Box>
      </Flex>
    )
  }

  return (
    <Flex alignItems="flex-start" height="100%">
      <Box padding={3} paddingRight={0}>
        <Text size={1}>
          <InfoOutlineIcon />
        </Text>
      </Box>
      <Box flexBasis="0%" flexGrow={1} padding={3}>
        <Text size={1} textOverflow="ellipsis" weight="semibold">
          {title || <>Untitled</>}
        </Text>
      </Box>
    </Flex>
  )
}

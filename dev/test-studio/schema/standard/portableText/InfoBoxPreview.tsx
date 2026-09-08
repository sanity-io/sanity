import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Flex, Text} from '@sanity/ui'
import {Box} from 'ui5'

interface InfoBoxPreviewProps {
  value?: {_type: 'infobox'; body: unknown[]; title: string}
}

export function InfoBoxPreview(props: InfoBoxPreviewProps) {
  const {value} = props
  const {body, title} = value || {}

  if (!body) {
    return (
      <Flex align="center" height="fill">
        <Box flexBasis="0%" flexGrow={1} padding={3}>
          <Text muted size={1} textOverflow="ellipsis">
            The info box content is empty 😿
          </Text>
        </Box>
      </Flex>
    )
  }

  return (
    <Flex align="flex-start" height="fill">
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

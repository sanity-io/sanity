import React from 'react'
import {ClipboardImageIcon, UploadIcon} from '@sanity/icons'
import {Box, Flex, Heading, Text} from '@sanity/ui'
import styled from 'styled-components'

type UploadPlaceholderProps = {
  canPaste?: boolean
  fileType?: string
}

const ClipboardBox = styled(Box)<{canPaste?: boolean}>`
  opacity: ${(props) => (props.canPaste ? 1 : 0.25)};
  transition-property: opacity;
  transition-duration: 100ms;
`

export default React.memo(function UploadPlaceholder({
  canPaste,
  fileType = 'file',
}: UploadPlaceholderProps) {
  return (
    <Flex height="fill" align="center" justify="center">
      <Box marginX={2}>
        <Box>
          <Box>
            <Heading align="center" size={5}>
              <UploadIcon />
            </Heading>
          </Box>
          <Box marginTop={4}>
            <Text weight="bold">Drop {fileType}</Text>
          </Box>
        </Box>
      </Box>
      <ClipboardBox canPaste={canPaste} marginX={2}>
        <Box>
          <Box>
            <Heading muted={!canPaste} align="center" size={5}>
              <ClipboardImageIcon />
            </Heading>
          </Box>
          <Box marginTop={4}>
            <Text muted={!canPaste} weight="bold">
              Paste {fileType}
            </Text>
          </Box>
        </Box>
      </ClipboardBox>
    </Flex>
  )
})

import React from 'react'
import {ClipboardImageIcon, UploadIcon} from '@sanity/icons'
import {Box, Flex, Heading, Text} from '@sanity/ui'
import styled from 'styled-components'
import {FileTarget} from './styles'

type UploadPlaceholderProps = {
  fileType?: string
}

const ClipboardBox = styled(Box)<{canPaste?: boolean}>`
  opacity: 0.25;
  ${FileTarget}:focus & {
    opacity: 1;
  }
  transition-property: opacity;
  transition-duration: 100ms;
`

export default React.memo(function UploadPlaceholder({fileType = 'file'}: UploadPlaceholderProps) {
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
      <ClipboardBox marginX={2}>
        <Box>
          <Box>
            <Heading align="center" size={5}>
              <ClipboardImageIcon />
            </Heading>
          </Box>
          <Box marginTop={4}>
            <Text weight="bold">Paste {fileType}</Text>
          </Box>
        </Box>
      </ClipboardBox>
    </Flex>
  )
})

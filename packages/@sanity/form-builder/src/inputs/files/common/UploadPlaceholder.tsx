import React from 'react'
import {ClipboardImageIcon, UploadIcon} from '@sanity/icons'
import {Box, Flex, Heading, Text} from '@sanity/ui'
import styled from 'styled-components'
import {FileTarget} from './styles'

const ClipboardBox = styled(Box)`
  opacity: 0.25;
  ${FileTarget}:focus & {
    opacity: 1;
  }
  transition-property: opacity;
  transition-duration: 100ms;
`

type UploadPlaceholderProps = {
  fileType?: string
}

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

import {Box} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {FieldPreviewComponent} from '../../../preview'

const StringWrapper = styled.div`
  display: inline-block;
  word-break: break-all;
  white-space: pre-wrap;
`

export const StringPreview: FieldPreviewComponent<string> = (props) => {
  const {value} = props

  return (
    <Box as={StringWrapper} paddingX={2} paddingY={1}>
      {value}
    </Box>
  )
}

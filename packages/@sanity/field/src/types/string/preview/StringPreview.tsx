import {Box} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {PreviewComponent} from '../../../preview/types'

const StringWrapper = styled.div`
  display: inline-block;
  word-break: break-all;
  white-space: pre-wrap;
`

export const StringPreview: PreviewComponent<string> = (props) => {
  const {value} = props

  return (
    <Box as={StringWrapper} paddingX={2} paddingY={1}>
      {value}
    </Box>
  )
}

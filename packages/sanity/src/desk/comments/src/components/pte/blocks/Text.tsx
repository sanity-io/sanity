import React, {PropsWithChildren} from 'react'
import {TextProps, Text as UIText} from '@sanity/ui'
import styled from 'styled-components'

const NormalText = styled('span')`
  display: inline-block;
  word-break: break-word;
`

export const Text = (props: TextProps & PropsWithChildren) => (
  <NormalText {...props} size={props.size || 1}>
    {props.children}
  </NormalText>
)

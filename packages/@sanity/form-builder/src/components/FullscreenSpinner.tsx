import {Flex, Layer, Spinner} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

const FullscreenLayer = styled(Layer)`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
`

export function FullscreenSpinner() {
  return (
    <FullscreenLayer>
      <Flex height="fill" align="center" justify="center">
        <Spinner />
      </Flex>
    </FullscreenLayer>
  )
}

import React from 'react'
import styled from 'styled-components'

import {Layer, Flex, Spinner} from '@sanity/ui'

const FullscreenLayer = styled(Layer)`
  position: absolute;
  width: 100%;
  height: 100%;
`

const FullscreenSpinner = () => (
  <FullscreenLayer>
    <Flex height="fill" align="center" justify="center">
      <Spinner />
    </Flex>
  </FullscreenLayer>
)

export {FullscreenSpinner}

import styled from 'styled-components'
import {Flex} from '@sanity/ui'
import React from 'react'

// todo:
//  This is a workaround for TS4023: Exported variable 'AssetBackground' has or is using name 'FlexProps'
//  Can be deleted when @sanity/ui exports FlexProps
type Workaround = React.ComponentType<React.ComponentProps<typeof Flex>>

export const AssetBackground: Workaround = styled(Flex)`
  height: 10rem;
`

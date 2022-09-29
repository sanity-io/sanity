import {Text, Box, Flex, Stack} from '@sanity/ui'
import React, {createElement} from 'react'
import styled from 'styled-components'

/** @internal */
export interface MetaInfoProps {
  title: string
  action?: string
  icon?: React.ComponentType
  children?: React.ReactNode
  markRemoved?: boolean
}

const MetaText = styled(Text)`
  color: inherit;
`

/** @internal */
export function MetaInfo(props: MetaInfoProps) {
  const {title, action, icon, children, markRemoved} = props

  return (
    <Flex padding={2} align="center">
      {icon && (
        <Box padding={2}>
          <MetaText size={4} forwardedAs={markRemoved ? 'del' : 'div'}>
            {createElement(icon)}
          </MetaText>
        </Box>
      )}

      <Stack space={2} paddingLeft={2}>
        <MetaText
          size={1}
          weight="semibold"
          forwardedAs={markRemoved ? 'del' : 'h3'}
          textOverflow="ellipsis"
        >
          {title}
        </MetaText>

        {action && <div>{action}</div>}

        <MetaText size={0} textOverflow="ellipsis">
          {children}
        </MetaText>
      </Stack>
    </Flex>
  )
}

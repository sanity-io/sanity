import {Box, Flex, Stack, Text} from '@sanity/ui'
import {type ComponentType, type ReactNode} from 'react'
import {styled} from 'styled-components'

/** @internal */
export interface MetaInfoProps {
  title: string
  action?: string
  icon?: ComponentType
  children?: ReactNode
  markRemoved?: boolean
}

const MetaText = styled(Text)`
  color: inherit;
`

/** @internal */
export function MetaInfo(props: MetaInfoProps) {
  const {title, action, icon: Icon, children, markRemoved} = props

  return (
    <Flex padding={2} align="center">
      {Icon && (
        <Box padding={2}>
          <MetaText size={4} forwardedAs={markRemoved ? 'del' : 'div'}>
            <Icon />
          </MetaText>
        </Box>
      )}

      <Stack space={2} paddingLeft={2}>
        <MetaText
          size={1}
          weight="medium"
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

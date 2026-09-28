import {type ComponentType, type ReactNode} from 'react'
import {styled} from 'styled-components'
import {Text, Box, Flex} from 'ui5'

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
    <Flex padding={2} alignItems="center">
      {Icon && (
        <Box padding={2}>
          <MetaText size={4} forwardedAs={markRemoved ? 'del' : 'div'} trim={true}>
            <Icon />
          </MetaText>
        </Box>
      )}

      <Flex gap={2} paddingLeft={2} flexDirection="column">
        <MetaText
          size={1}
          weight="medium"
          forwardedAs={markRemoved ? 'del' : 'h3'}
          truncate={1}
          trim={true}
        >
          {title}
        </MetaText>

        {action && <div>{action}</div>}

        <MetaText size={0} truncate={1} forwardedAs="div" trim={true}>
          {children}
        </MetaText>
      </Flex>
    </Flex>
  )
}

import {clsx} from 'clsx'
import {type ComponentProps, type ComponentType, type ReactNode} from 'react'
import {Text, Box, Flex, Icon, type IconProps} from 'ui5'

import {metaText} from './MetaInfo.css'

/** @internal */
export interface MetaInfoProps {
  title: string
  action?: string
  icon?: ComponentType
  children?: ReactNode
  markRemoved?: boolean
}

function MetaText(props: ComponentProps<typeof Text>) {
  const {className, ...rest} = props

  return <Text {...rest} className={clsx(metaText, className)} />
}

/** @internal */
export function MetaInfo(props: MetaInfoProps) {
  const {title, action, icon: IconComponent, children, markRemoved} = props

  return (
    <Flex padding={2} alignItems="center">
      {IconComponent && (
        <Box padding={2} as={markRemoved ? 'del' : 'div'}>
          <Icon icon={IconComponent as IconProps['icon']} size={4} style={{color: 'inherit'}} />
        </Box>
      )}

      <Flex gap={2} paddingLeft={2} flexDirection="column">
        <MetaText size={1} weight="medium" as={markRemoved ? 'del' : 'h3'} truncate={1} trim={true}>
          {title}
        </MetaText>

        {action && <div>{action}</div>}

        <MetaText size={0} truncate={1} as="div" trim={true}>
          {children}
        </MetaText>
      </Flex>
    </Flex>
  )
}

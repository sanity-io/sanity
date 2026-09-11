import {Stack, Text} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, type ComponentType, type ReactNode} from 'react'
import {Box, Flex} from 'ui5'

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
  const {title, action, icon: Icon, children, markRemoved} = props

  return (
    <Flex padding={2} alignItems="center">
      {Icon && (
        <Box padding={2}>
          <MetaText size={4} as={markRemoved ? 'del' : 'div'}>
            <Icon />
          </MetaText>
        </Box>
      )}

      <Stack gap={2} paddingLeft={2}>
        <MetaText size={1} weight="medium" as={markRemoved ? 'del' : 'h3'} textOverflow="ellipsis">
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

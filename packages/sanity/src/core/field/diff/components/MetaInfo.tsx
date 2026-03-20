import {Box, Flex, Stack, Text} from '@sanity/ui'
import {type ComponentType, type ReactNode} from 'react'

import {metaText} from './MetaInfo.css'

/** @internal */
export interface MetaInfoProps {
  title: string
  action?: string
  icon?: ComponentType
  children?: ReactNode
  markRemoved?: boolean
}

/** @internal */
export function MetaInfo(props: MetaInfoProps) {
  const {title, action, icon: Icon, children, markRemoved} = props

  return (
    <Flex padding={2} align="center">
      {Icon && (
        <Box padding={2}>
          <Text className={metaText} size={4} forwardedAs={markRemoved ? 'del' : 'div'}>
            <Icon />
          </Text>
        </Box>
      )}

      <Stack space={2} paddingLeft={2}>
        <Text
          className={metaText}
          size={1}
          weight="medium"
          forwardedAs={markRemoved ? 'del' : 'h3'}
          textOverflow="ellipsis"
        >
          {title}
        </Text>

        {action && <div>{action}</div>}

        <Text className={metaText} size={0} textOverflow="ellipsis">
          {children}
        </Text>
      </Stack>
    </Flex>
  )
}

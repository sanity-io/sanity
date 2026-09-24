import {Text} from '@sanity/ui'
import {useMemo} from 'react'
import {Flex, VStack} from 'ui5'

import {Tooltip} from '../../ui-components/tooltip/Tooltip'
import {UserAvatar} from '../components/userAvatar/UserAvatar'
import {type FormNodePresence} from './types'

interface PresenceTooltipProps {
  children?: React.JSX.Element
  items: FormNodePresence[]
}

/**
 * The "documentScrollElement" is being passed to the PortalProvider in DocumentPanel.
 * The default portal element provided by the PortalProvider causes some layout issues with the Tooltip.
 * Therefore, another portal element (i.e. the "documentScrollElement") is being used to solve this.
 */

export function PresenceTooltip(props: PresenceTooltipProps) {
  const {children, items} = props

  const content = useMemo(
    () => (
      <VStack>
        {items.map((item) => (
          <Flex key={item.user.id} alignItems="center" gap={2}>
            <div>
              <UserAvatar user={item.user} status="online" />
            </div>

            <Text size={1}>{item.user.displayName}</Text>
          </Flex>
        ))}
      </VStack>
    ),
    [items],
  )

  return (
    <Tooltip content={content} placement="top" portal="documentScrollElement">
      {children}
    </Tooltip>
  )
}

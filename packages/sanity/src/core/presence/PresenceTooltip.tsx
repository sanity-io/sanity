import {useMemo} from 'react'
import {Text, Flex, VStack} from 'ui5'

import {Tooltip} from '../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {presenceIdentity} from '../store/presence/agentPresence'
import {PresenceAvatar} from './PresenceAvatar'
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
  const {t} = useTranslation()

  const content = useMemo(
    () => (
      <VStack>
        {items.map((item) => (
          <Flex key={presenceIdentity(item)} alignItems="center" gap={2}>
            <div>
              <PresenceAvatar actor={item.actor} user={item.user} status="online" />
            </div>

            <Text size={1} as="div" trim={true}>
              {item.actor?.type === 'agent'
                ? t('presence.agent-label', {displayName: item.user.displayName})
                : item.user.displayName}
            </Text>
          </Flex>
        ))}
      </VStack>
    ),
    [items, t],
  )

  return (
    <Tooltip content={content} placement="top" portal="documentScrollElement">
      {children}
    </Tooltip>
  )
}

import {type CurrentUser} from '@sanity/types'
import {Box} from '@sanity/ui'
import {type ElementTone} from '@sanity/ui/theme'
import {type ComponentType, type ReactNode} from 'react'

import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {
  InsufficientPermissionsMessage,
  type InsufficientPermissionsMessageProps,
} from '../../../components/InsufficientPermissionsMessage'

interface Props {
  currentUser?: CurrentUser
  hasPermission?: boolean
  icon: ComponentType | ReactNode
  onClick: () => void
  permissionsOperationLabel: InsufficientPermissionsMessageProps['context']
  title: string
  tone?: ElementTone
  disabled?: boolean
}

const MenuItemWithPermissionsTooltip = (props: Props) => {
  const {
    currentUser,
    hasPermission,
    icon,
    onClick,
    permissionsOperationLabel,
    title,
    tone,
    disabled,
  } = props
  return (
    <Tooltip
      content={
        <Box paddingX={2} paddingY={1}>
          <InsufficientPermissionsMessage
            currentUser={currentUser}
            context={permissionsOperationLabel}
          />
        </Box>
      }
      disabled={hasPermission}
      placement="left"
      portal
    >
      {/* Wrapper element to allow disabled menu items to trigger tooltips */}
      <div>
        <MenuItem
          disabled={!hasPermission || disabled}
          icon={icon}
          onClick={onClick}
          text={title}
          tone={tone}
        />
      </div>
    </Tooltip>
  )
}

export default MenuItemWithPermissionsTooltip

import {type CurrentUser} from '@sanity/types'
import {Box, type SelectableTone} from '@sanity/ui'
import {type ComponentType, type ReactNode} from 'react'

import {MenuItem, Tooltip} from '../../../../ui-components'
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
  tone?: SelectableTone
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

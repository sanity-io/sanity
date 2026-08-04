import {LockIcon} from '@sanity/icons/Lock'
import {Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'

export function PrivateIcon() {
  return (
    <Tooltip
      content={
        <Text size={1} style={{whiteSpace: 'nowrap'}}>
          Only visible to you
        </Text>
      }
      padding={2}
      placement="top"
      portal
    >
      <LockIcon />
    </Tooltip>
  )
}

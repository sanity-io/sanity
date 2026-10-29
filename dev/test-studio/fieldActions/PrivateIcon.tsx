import {LockIcon} from '@sanity/icons/Lock'
import {Tooltip} from '@sanity/ui/tooltip'
import {Text} from 'ui5'

export function PrivateIcon() {
  return (
    <Tooltip
      content={
        <Text size={1} style={{whiteSpace: 'nowrap'}} as="div" trim={true}>
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

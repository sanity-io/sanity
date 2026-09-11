import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {Stack, Text} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentType, isValidElement, type ReactNode, useMemo} from 'react'
import {isValidElementType} from 'react-is'
import {Flex, Box} from 'ui5'

import {media, mediaSize} from './WorkspacePreview.css'

export const STATE_TITLES = {
  'loading': 'Checking…',
  'logged-in': '',
  'logged-out': 'Signed out',
  'no-access': '',
}

type PreviewIconSize = 'small' | 'large'

export const WorkspacePreviewIcon = ({
  icon,
  size = 'small',
}: {
  icon: ComponentType | ReactNode
  size: PreviewIconSize
}) => {
  const iconComponent = useMemo(() => createIcon(icon), [icon])

  return <div className={clsx(media, mediaSize[size])}>{iconComponent}</div>
}

const createIcon = (Icon: ComponentType | ReactNode) => {
  if (isValidElementType(Icon)) return <Icon />
  if (isValidElement(Icon)) return Icon
  return undefined
}

export interface WorkspacePreviewProps {
  icon?: ComponentType | ReactNode
  iconRight?: ComponentType | ReactNode
  selected?: boolean
  state?: 'loading' | 'logged-in' | 'logged-out' | 'no-access'
  subtitle?: string
  title: string
}

export function WorkspacePreview(props: WorkspacePreviewProps) {
  const {state, subtitle, selected, title, icon, iconRight} = props

  const iconRightComponent = useMemo(() => createIcon(iconRight), [iconRight])

  return (
    <Flex alignItems="center" flexBasis="auto" flexGrow={0} flexShrink={0} gap={3}>
      <WorkspacePreviewIcon icon={icon} size="small" />

      <Stack flex={1} gap={2}>
        <Text size={1} textOverflow="ellipsis" weight="medium">
          {title}
        </Text>

        {subtitle && (
          <Text muted size={1} textOverflow="ellipsis">
            {subtitle}
          </Text>
        )}
      </Stack>

      {state && STATE_TITLES[state] && (
        <Box paddingLeft={1}>
          <Text size={1} muted textOverflow="ellipsis">
            {STATE_TITLES[state]}
          </Text>
        </Box>
      )}

      {(selected || iconRightComponent) && (
        <Flex alignItems="center" gap={4} paddingLeft={3} paddingRight={2}>
          {selected && (
            <Text>
              <CheckmarkIcon />
            </Text>
          )}

          {iconRightComponent && <Text muted>{iconRightComponent}</Text>}
        </Flex>
      )}
    </Flex>
  )
}

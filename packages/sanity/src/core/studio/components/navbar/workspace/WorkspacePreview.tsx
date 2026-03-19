import {CheckmarkIcon} from '@sanity/icons'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import {type ComponentType, isValidElement, type ReactNode, useMemo} from 'react'
import {isValidElementType} from 'react-is'

export const STATE_TITLES = {
  'logged-in': '',
  'logged-out': 'Signed out',
  'no-access': '',
}

import {media as mediaStyles} from './WorkspacePreview.css'

type PreviewIconSize = 'small' | 'large'

export const WorkspacePreviewIcon = ({
  icon,
  size = 'small',
}: {
  icon: ComponentType | ReactNode
  size: PreviewIconSize
}) => {
  const iconComponent = useMemo(() => createIcon(icon), [icon])

  return <div className={mediaStyles[size]}>{iconComponent}</div>
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
  state?: 'logged-in' | 'logged-out' | 'no-access'
  subtitle?: string
  title: string
}

export function WorkspacePreview(props: WorkspacePreviewProps) {
  const {state, subtitle, selected, title, icon, iconRight} = props

  const iconRightComponent = useMemo(() => createIcon(iconRight), [iconRight])

  return (
    <Flex align="center" flex="none" gap={3}>
      <WorkspacePreviewIcon icon={icon} size="small" />

      <Stack flex={1} space={2}>
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
        <Flex align="center" gap={4} paddingLeft={3} paddingRight={2}>
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

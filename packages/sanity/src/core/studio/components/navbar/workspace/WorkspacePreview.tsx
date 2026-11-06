import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {clsx} from 'clsx'
import {type ComponentType, isValidElement, type ReactNode, useMemo} from 'react'
import {isValidElementType} from 'react-is'
import {Text, Box, Flex, Icon, type IconProps} from 'ui5'

import {type WorkspaceLoginStatus} from './hooks/useWorkspaceLoginStatus'
import {media, mediaSize} from './WorkspacePreview.css'

export const STATE_TITLES = {
  'loading': 'Checking…',
  'logged-in': '',
  'logged-out': 'Signed out',
  'unknown': '',
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

const createIcon = (iconSource: ComponentType | ReactNode) => {
  if (isValidElementType(iconSource)) {
    const Component = iconSource
    return <Component />
  }
  if (isValidElement(iconSource)) return iconSource
  return undefined
}

export interface WorkspacePreviewProps {
  icon?: ComponentType | ReactNode
  iconRight?: IconProps['icon']
  selected?: boolean
  state?: WorkspaceLoginStatus
  subtitle?: string
  title: string
}

export function WorkspacePreview(props: WorkspacePreviewProps) {
  const {state, subtitle, selected, title, icon, iconRight} = props

  return (
    <Flex alignItems="center" flexBasis="auto" flexGrow={0} flexShrink={0} gap={3}>
      <WorkspacePreviewIcon icon={icon} size="small" />

      <Flex flexBasis="0%" flexGrow={1} gap={2} flexDirection="column">
        <Text size={1} truncate={1} weight="medium" as="div" trim={true}>
          {title}
        </Text>

        {subtitle && (
          <Text muted size={1} truncate={1} as="div" trim={true}>
            {subtitle}
          </Text>
        )}
      </Flex>

      {state && STATE_TITLES[state] && (
        <Box paddingLeft={1}>
          <Text size={1} muted truncate={1} as="div" trim={true}>
            {STATE_TITLES[state]}
          </Text>
        </Box>
      )}

      {(selected || iconRight) && (
        <Flex alignItems="center" gap={4} paddingLeft={3} paddingRight={2}>
          {selected && <Icon icon={CheckmarkIcon} style={{margin: '-0.4375rem'}} />}
          {iconRight && <Icon muted icon={iconRight} style={{margin: '-0.4375rem'}} />}
        </Flex>
      )}
    </Flex>
  )
}

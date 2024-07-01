<<<<<<< HEAD
import {Box, Button} from '@sanity/ui'

import {type Version} from '../types'
import {VersionIcon} from './VersionIcon'

export function VersionBadge(props: {version: Version}): JSX.Element {
  const {version} = props

  return (
    <Box flex="none">
      <Button as="a" mode="bleed" padding={0} radius="full">
        <VersionIcon tone={version.tone} icon={version.icon} padding={2} title={version.title} />
      </Button>
    </Box>
=======
import {ChevronDownIcon, Icon} from '@sanity/icons'
<<<<<<<< HEAD:packages/sanity/src/core/versions/components/VersionIcon.tsx
// eslint-disable-next-line camelcase
========
>>>>>>>> corel:packages/sanity/src/core/versions/components/VersionBadge.tsx
import {Box, Flex, Text} from '@sanity/ui'
import {type CSSProperties} from 'react'

import {type SanityVersionIcon} from '../types'

<<<<<<<< HEAD:packages/sanity/src/core/versions/components/VersionIcon.tsx
export function VersionIcon(
========
export function VersionBadge(
>>>>>>>> corel:packages/sanity/src/core/versions/components/VersionBadge.tsx
  props: Partial<SanityVersionIcon> & {openButton?: boolean; padding?: number; title?: string},
): JSX.Element {
  const {tone, icon, openButton, padding = 3, title} = props

  return (
    <Flex
      gap={padding}
      padding={padding}
      style={
        {
          '--card-fg-color': `var(--card-badge-${tone}-fg-color)`,
          '--card-icon-color': `var(--card-badge-${tone}-icon-color)`,
          'backgroundColor': `var(--card-badge-${tone}-bg-color)`,
          'borderRadius': '9999px',
        } as CSSProperties
      }
    >
      {icon && (
        <Box flex="none">
          <Text size={1}>
            <Icon symbol={icon} />
          </Text>
        </Box>
      )}
      {title && (
        <Box flex="none">
          <Text size={1}>{title}</Text>
        </Box>
      )}
      {openButton && (
        <Box flex="none">
          <Text size={1}>
            <ChevronDownIcon />
          </Text>
        </Box>
      )}
    </Flex>
>>>>>>> corel
  )
}

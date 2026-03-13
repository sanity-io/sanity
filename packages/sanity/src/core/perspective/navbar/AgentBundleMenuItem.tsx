import {SparkleIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- MenuItem with custom children not supported by ui-components
import {Box, Flex, MenuItem, Stack, Text} from '@sanity/ui'
import {type CSSProperties, memo, useCallback} from 'react'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {type AgentBundle} from '../../store/agent/createAgentBundlesStore'
import {usePerspective} from '../usePerspective'
import {useSetPerspective} from '../useSetPerspective'

const iconStyle: CSSProperties & {'--card-icon-color': string} = {
  '--card-icon-color': 'var(--card-badge-suggest-icon-color)',
}

/**
 * Renders a menu item for an active agent bundle in the global perspective
 * picker. Visually matches `GlobalPerspectiveMenuItem` so it blends into the
 * existing release list.
 *
 * @internal
 */
export const AgentBundleMenuItem = memo(function AgentBundleMenuItem({
  bundle,
}: {
  bundle: AgentBundle
}) {
  const {t} = useTranslation()
  const setPerspective = useSetPerspective()
  const {selectedPerspectiveName} = usePerspective()

  const active = selectedPerspectiveName === bundle.id
  const label = t('version.agent-bundle.proposed-changes')

  const handleClick = useCallback(() => setPerspective(bundle.id), [bundle.id, setPerspective])

  return (
    <MenuItem onClick={handleClick} padding={1} pressed={active} selected={active}>
      <Flex align="flex-start" gap={1}>
        <Box flex="none" paddingX={3} paddingY={2}>
          <Text size={1} style={iconStyle}>
            <SparkleIcon />
          </Text>
        </Box>
        <Stack
          flex={1}
          paddingY={2}
          paddingRight={2}
          space={2}
          style={{maxWidth: '200px', minWidth: 0}}
        >
          <Flex gap={3} align="center" style={{minWidth: 0}}>
            <Text size={1} weight="medium" style={{minWidth: 0}}>
              {label}
            </Text>
          </Flex>
        </Stack>
      </Flex>
    </MenuItem>
  )
})

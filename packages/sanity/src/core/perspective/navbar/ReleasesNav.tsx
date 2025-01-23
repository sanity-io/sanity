import {CalendarIcon, CloseIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Box, Button, Card, Flex} from '@sanity/ui'
import {AnimatePresence} from 'framer-motion'
import {useCallback, useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {useRouterState} from 'sanity/router'

import {Tooltip} from '../../../ui-components'
import {usePerspective} from '../../perspective/usePerspective'
import {useSetPerspective} from '../../perspective/useSetPerspective'
import {RELEASES_TOOL_NAME} from '../../releases/plugin'
import {LATEST} from '../../releases/util/const'
import {isDraftPerspective} from '../../releases/util/util'
import {ToolLink, useWorkspace} from '../../studio'
import {CurrentGlobalPerspectiveLabel} from './currentGlobalPerspectiveLabel'
import {GlobalPerspectiveMenu} from './GlobalPerspectiveMenu'

export function ReleasesNav(): React.JSX.Element {
  const areReleasesEnabled = !!useWorkspace().releases?.enabled

  const activeToolName = useRouterState(
    useCallback(
      (routerState) => (typeof routerState.tool === 'string' ? routerState.tool : undefined),
      [],
    ),
  )

  const {selectedPerspective, selectedReleaseId} = usePerspective()
  const setPerspective = useSetPerspective()
  const {t} = useTranslation()

  const handleClearPerspective = () => setPerspective(LATEST)

  const releasesToolLink = useMemo(
    () => (
      <Tooltip content={t('release.navbar.tooltip')}>
        <Button
          as={ToolLink}
          name={RELEASES_TOOL_NAME}
          data-as="a"
          icon={CalendarIcon}
          mode="bleed"
          padding={2}
          radius="full"
          selected={activeToolName === RELEASES_TOOL_NAME}
          space={2}
        />
      </Tooltip>
    ),
    [activeToolName, t],
  )

  return (
    <Card flex="none" border marginRight={1} radius="full" tone="inherit" style={{margin: -1}}>
      <Flex gap={0}>
        {areReleasesEnabled && (
          <Box data-testid="releases-tool-link" flex="none">
            {releasesToolLink}
          </Box>
        )}
        <AnimatePresence>
          <CurrentGlobalPerspectiveLabel selectedPerspective={selectedPerspective} />
        </AnimatePresence>
        <GlobalPerspectiveMenu
          selectedReleaseId={selectedReleaseId}
          areReleasesEnabled={areReleasesEnabled}
        />
        {!isDraftPerspective(selectedPerspective) && (
          <div>
            <Button
              icon={CloseIcon}
              mode="bleed"
              onClick={handleClearPerspective}
              data-testid="clear-perspective-button"
              padding={2}
              radius="full"
            />
          </div>
        )}
      </Flex>
    </Card>
  )
}

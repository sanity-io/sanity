import {CalendarIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Box, Button} from '@sanity/ui'
import {useCallback} from 'react'
import {useTranslation} from 'react-i18next'
import {useRouterState} from 'sanity/router'

import {Tooltip} from '../../ui-components/tooltip/Tooltip'
import {RELEASES_TOOL_NAME} from '../releases/plugin'
import {ToolLink} from '../studio/components/navbar/tools/ToolLink'

/**
 * represents the calendar icon for the releases tool.
 * It will be hidden if users have turned off releases.
 */
export function ReleasesToolLink(): React.JSX.Element {
  const {t} = useTranslation()

  const activeToolName = useRouterState(
    useCallback(
      (routerState) => (typeof routerState.tool === 'string' ? routerState.tool : undefined),
      [],
    ),
  )

  return (
    <Box data-testid="releases-tool-link" flex="none">
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
    </Box>
  )
}

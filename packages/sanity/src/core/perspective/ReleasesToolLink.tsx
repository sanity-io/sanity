import {CalendarIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Button} from '@sanity/ui'
import {useCallback} from 'react'
import {useTranslation} from 'react-i18next'
import {useObservable} from 'react-rx'
import {useRouterState} from 'sanity/router'
import {styled} from 'styled-components'

import {Tooltip} from '../../ui-components/tooltip/Tooltip'
import {RELEASES_TOOL_NAME} from '../releases/plugin'
import {useReleasesStore} from '../releases/store/useReleasesStore'
import {ToolLink} from '../studio/components/navbar/tools/ToolLink'
import {oversizedButtonStyle} from './styles'

const Dot = styled.div({
  width: 4,
  height: 4,
  borderRadius: 3,
  boxShadow: '0 0 0 1px var(--card-bg-color)',
})

const OversizedButton = styled(ToolLink)`
  ${oversizedButtonStyle}
`

/**
 * represents the calendar icon for the releases tool.
 * It will be hidden if users have turned off releases.
 */
export function ReleasesToolLink(): React.JSX.Element {
  const {t} = useTranslation()
  const {errorCount$} = useReleasesStore()
  const errorCount = useObservable(errorCount$)
  const hasError = errorCount !== 0

  const activeToolName = useRouterState(
    useCallback(
      (routerState) => (typeof routerState.tool === 'string' ? routerState.tool : undefined),
      [],
    ),
  )

  return (
    <Tooltip content={t('release.navbar.tooltip')}>
      <Button
        as={OversizedButton}
        name={RELEASES_TOOL_NAME}
        data-as="a"
        icon={CalendarIcon}
        mode="bleed"
        padding={2}
        radius="full"
        data-testid="releases-tool-link"
        selected={activeToolName === RELEASES_TOOL_NAME}
      >
        {hasError && (
          <Dot
            data-ui="error-status-icon"
            style={{
              backgroundColor: `var(--card-badge-critical-dot-color)`,
            }}
          />
        )}
      </Button>
    </Tooltip>
  )
}

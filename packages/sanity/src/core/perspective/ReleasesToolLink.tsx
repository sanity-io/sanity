// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Button} from '@sanity/ui'
import {useCallback} from 'react'
import {useObservable} from 'react-rx'
import {useRouterState} from 'sanity/router'

import {Tooltip} from '../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../i18n'
import {ReleaseAvatarIcon} from '../releases'
import {useReleasesStore} from '../releases/store/useReleasesStore'
import {SCHEDULES_TOOL_NAME} from '../schedules/plugin'
import {ToolLink} from '../studio/components/navbar/tools/ToolLink'
import {dot} from './ReleasesToolLink.css'
import {oversizedButtonStyle} from './styles.css'
import {usePerspective} from './usePerspective'

/**
 * represents the calendar icon for the releases tool.
 * It will be hidden if users have turned off releases.
 */
export function ReleasesToolLink(): React.JSX.Element {
  const {t} = useTranslation()
  const {errorCount$} = useReleasesStore()
  const errorCount = useObservable(errorCount$)
  const hasError = errorCount !== 0
  const {selectedPerspective} = usePerspective()
  const activeToolName = useRouterState(
    useCallback(
      (routerState) => (typeof routerState.tool === 'string' ? routerState.tool : undefined),
      [],
    ),
  )

  return (
    <Tooltip content={t('release.navbar.tooltip')}>
      <Button
        as={ToolLink}
        className={oversizedButtonStyle}
        name={SCHEDULES_TOOL_NAME}
        data-as="a"
        icon={<ReleaseAvatarIcon release={selectedPerspective} />}
        mode="bleed"
        padding={2}
        radius="full"
        data-testid="releases-tool-link"
        selected={activeToolName === SCHEDULES_TOOL_NAME}
      >
        {hasError && (
          <div
            className={dot}
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

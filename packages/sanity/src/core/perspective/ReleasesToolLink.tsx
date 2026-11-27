// oxlint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Button} from '@sanity/ui'
import {useCallback} from 'react'
import {useRouterState} from 'sanity/router'
import {styled} from 'styled-components'

import {Tooltip} from '../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {ReleaseAvatarIcon} from '../releases/components/ReleaseAvatar'
import {SCHEDULES_TOOL_NAME} from '../schedules/constants'
import {ToolLink} from '../studio/components/navbar/tools/ToolLink'
import {oversizedButtonStyle} from './styles'
import {usePerspective} from './usePerspective'

const OversizedButton = styled(ToolLink)`
  ${oversizedButtonStyle}
`

/**
 * The releases-tool control in the classic navbar pill.
 * Hidden when the workspace has no releases tool.
 */
export function ReleasesToolLink(): React.JSX.Element {
  const {t} = useTranslation()
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
        as={OversizedButton}
        name={SCHEDULES_TOOL_NAME}
        data-as="a"
        fontSize={2}
        icon={<ReleaseAvatarIcon size="small" release={selectedPerspective} fontSize={2} />}
        mode="bleed"
        padding={2}
        radius="full"
        data-testid="releases-tool-link"
        selected={activeToolName === SCHEDULES_TOOL_NAME}
      >
        {/* `ToolLink` requires children, but the icon is the whole control */}
        {null}
      </Button>
    </Tooltip>
  )
}

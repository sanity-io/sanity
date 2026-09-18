import {AddIcon} from '@sanity/icons/Add'
import {type ComponentProps, type ComponentType, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {from} from 'rxjs'

import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../studio/workspace'
import {useCreateReleaseMetadata} from '../hooks/useCreateReleaseMetadata'
import {useActiveReleases} from '../store/useActiveReleases'
import {useReleaseOperations} from '../store/useReleaseOperations'
import {useReleasePermissions} from '../store/useReleasePermissions'
import {getReleaseDefaults} from '../util/util'

interface Props {
  onCreateRelease: () => void
  /**
   * Overrides the default label. The perspective menu's action block reads as a list of things to
   * go and do ("View scheduled drafts", "View content releases"), so it asks for a verb the
   * releases overview's own primary button does not need.
   */
  text?: string
  /**
   * Overrides the wrapper's own left inset, which it hardcodes to a scale step. The perspective
   * menu's action block aligns this icon's *ink* with the release rows above it, and the value
   * that does so is not on the 4px scale — see `ScheduledDraftsMenuItem`. The context menu leaves
   * this alone and keeps the wrapper's default.
   */
  style?: ComponentProps<typeof MenuItem>['style']
}

export const CreateReleaseMenuItem: ComponentType<Props> = ({onCreateRelease, style, text}) => {
  const {t} = useTranslation()
  const {createRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()
  const createReleaseMetadata = useCreateReleaseMetadata()

  const hasCreatePermission = useObservable(
    useMemo(
      () =>
        from(checkWithPermissionGuard(createRelease, createReleaseMetadata(getReleaseDefaults()))),
      [checkWithPermissionGuard, createRelease, createReleaseMetadata],
    ),
    undefined,
  )

  const activeReleases = useActiveReleases()
  const activeReleaseCount = activeReleases.data.length

  const {releases} = useWorkspace()
  const workspaceReleaseLimit = releases?.limit ?? Infinity
  const isWorkspaceReleaseLimitReached = activeReleaseCount >= workspaceReleaseLimit

  const menuItemProps: Pick<
    ComponentProps<typeof MenuItem>,
    'icon' | 'onClick' | 'style' | 'text'
  > & {
    'data-testid': string
  } = {
    'icon': AddIcon,
    'onClick': onCreateRelease,
    'data-testid': 'create-new-release-button',
    style,
    'text': text ?? t('release.action.create-new'),
  }

  if (isWorkspaceReleaseLimitReached) {
    return (
      <MenuItem
        {...menuItemProps}
        tooltipProps={{
          content: t('release.action.new-release.limit-reached', {
            count: workspaceReleaseLimit,
          }),
        }}
        disabled
      />
    )
  }

  if (!hasCreatePermission) {
    return (
      <MenuItem
        {...menuItemProps}
        tooltipProps={{
          content: t('release.action.permission.error'),
        }}
        disabled
      />
    )
  }

  return <MenuItem {...menuItemProps} />
}

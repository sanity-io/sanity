import {AddIcon} from '@sanity/icons'
import {type ComponentProps, type ComponentType, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {from} from 'rxjs'

import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../studio/workspace'
import {useReleasesUpsell} from '../contexts/upsell/useReleasesUpsell'
import {useCreateReleaseMetadata} from '../hooks/useCreateReleaseMetadata'
import {useActiveReleases} from '../store/useActiveReleases'
import {useReleaseOperations} from '../store/useReleaseOperations'
import {useReleasePermissions} from '../store/useReleasePermissions'
import {getReleaseDefaults} from '../util/util'

interface Props {
  onCreateRelease: () => void
}

export const CreateReleaseMenuItem: ComponentType<Props> = ({onCreateRelease}) => {
  const {t} = useTranslation()
  const {mode: planQuotaMode} = useReleasesUpsell()
  const {createRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()
  const createReleaseMetadata = useCreateReleaseMetadata()

  const hasCreatePermission = useObservable(
    useMemo(
      () =>
        from(checkWithPermissionGuard(createRelease, createReleaseMetadata(getReleaseDefaults()))),
      [checkWithPermissionGuard, createRelease, createReleaseMetadata],
    ),
  )

  const activeReleases = useActiveReleases()
  const activeReleaseCount = activeReleases.data.length

  const {releases} = useWorkspace()
  const workspaceReleaseLimit = releases?.limit ?? Infinity
  const isWorkspaceReleaseLimitReached = activeReleaseCount >= workspaceReleaseLimit

  const menuItemProps: Pick<ComponentProps<typeof MenuItem>, 'icon' | 'onClick' | 'text'> & {
    'data-testid': string
  } = {
    'icon': AddIcon,
    'onClick': onCreateRelease,
    'data-testid': 'create-new-release-button',
    'text': t('release.action.create-new'),
  }

  if (isWorkspaceReleaseLimitReached) {
    return (
      <MenuItem
        {...menuItemProps}
        text={t('release.action.create-new')}
        tooltipProps={{
          content: t('release.action.new-release.limit-reached', {
            count: workspaceReleaseLimit,
          }),
        }}
        disabled
      />
    )
  }

  if (!hasCreatePermission || planQuotaMode === 'disabled') {
    return (
      <MenuItem
        {...menuItemProps}
        tooltipProps={{
          disabled: hasCreatePermission === true,
          content: t('release.action.permission.error'),
        }}
        disabled
      />
    )
  }

  return <MenuItem {...menuItemProps} />
}

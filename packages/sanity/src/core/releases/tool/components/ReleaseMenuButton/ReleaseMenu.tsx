import {ArchiveIcon, CloseCircleIcon, TrashIcon, UnarchiveIcon} from '@sanity/icons'
import {
  type Dispatch,
  type MouseEventHandler,
  type SetStateAction,
  useCallback,
  useMemo,
} from 'react'

import {MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {useReleasesUpsell} from '../../../contexts/upsell/useReleasesUpsell'
import {releasesLocaleNamespace} from '../../../i18n'
import {type ReleaseAction} from './releaseActions'
import {type ReleaseMenuButtonProps} from './ReleaseMenuButton'

export type ReleaseMenuProps = Omit<ReleaseMenuButtonProps, 'documentsCount'> & {
  disabled: boolean
  setSelectedAction: Dispatch<SetStateAction<ReleaseAction | undefined>>
}

export const ReleaseMenu = ({
  ignoreCTA,
  disabled,
  release,
  setSelectedAction,
}: ReleaseMenuProps) => {
  const releaseMenuDisabled = !release || disabled
  const {t} = useTranslation(releasesLocaleNamespace)
  const {mode} = useReleasesUpsell()
  const handleOnInitiateAction = useCallback<MouseEventHandler<HTMLDivElement>>(
    (event) => {
      const action = event.currentTarget.getAttribute('data-value') as ReleaseAction

      setSelectedAction(action)
    },
    [setSelectedAction],
  )

  const archiveUnarchiveMenuItem = useMemo(() => {
    if (release.state === 'published') return null

    if (release.state === 'archived')
      return (
        <MenuItem
          data-value="unarchive"
          disabled={mode === 'disabled'}
          onClick={handleOnInitiateAction}
          icon={UnarchiveIcon}
          text={t('action.unarchive')}
          data-testid="unarchive-release-menu-item"
        />
      )

    return (
      <MenuItem
        tooltipProps={{
          disabled: !['scheduled', 'scheduling'].includes(release.state) || disabled,
          content: t('action.archive.tooltip'),
        }}
        data-value="archive"
        onClick={handleOnInitiateAction}
        icon={ArchiveIcon}
        text={t('action.archive')}
        data-testid="archive-release-menu-item"
        disabled={['scheduled', 'scheduling'].includes(release.state)}
      />
    )
  }, [handleOnInitiateAction, disabled, release.state, t, mode])

  const deleteMenuItem = useMemo(() => {
    if (release.state !== 'archived' && release.state !== 'published') return null

    return (
      <MenuItem
        data-value="delete"
        onClick={handleOnInitiateAction}
        disabled={releaseMenuDisabled}
        icon={TrashIcon}
        text={t('action.delete-release')}
        data-testid="delete-release-menu-item"
      />
    )
  }, [handleOnInitiateAction, release.state, releaseMenuDisabled, t])

  const unscheduleMenuItem = useMemo(() => {
    if (ignoreCTA || (release.state !== 'scheduled' && release.state !== 'scheduling')) return null

    return (
      <MenuItem
        data-value="unschedule"
        onClick={handleOnInitiateAction}
        disabled={releaseMenuDisabled}
        icon={CloseCircleIcon}
        text={t('action.unschedule')}
        data-testid="unschedule-release-menu-item"
      />
    )
  }, [handleOnInitiateAction, ignoreCTA, release.state, releaseMenuDisabled, t])

  return (
    <>
      {unscheduleMenuItem}
      {archiveUnarchiveMenuItem}
      {deleteMenuItem}
    </>
  )
}

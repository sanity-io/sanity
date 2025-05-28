import {ArchiveIcon, CloseCircleIcon, TrashIcon, UnarchiveIcon} from '@sanity/icons'
import {
  type Dispatch,
  type MouseEventHandler,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {useReleasesUpsell} from '../../../contexts/upsell/useReleasesUpsell'
import {releasesLocaleNamespace} from '../../../i18n'
import {useReleaseOperations} from '../../../store'
import {useReleasePermissions} from '../../../store/useReleasePermissions'
import {type DocumentInRelease} from '../../detail/useBundleDocuments'
import {ReleasePublishAllButton} from '../releaseCTAButtons/ReleasePublishAllButton'
import {ReleaseScheduleButton} from '../releaseCTAButtons/ReleaseScheduleButton'
import {type ReleaseAction} from './releaseActions'
import {type ReleaseMenuButtonProps} from './ReleaseMenuButton'

export type ReleaseMenuProps = Omit<ReleaseMenuButtonProps, 'documentsCount'> & {
  disabled: boolean
  setSelectedAction: Dispatch<SetStateAction<ReleaseAction | undefined>>
  documents: DocumentInRelease[]
}

export const ReleaseMenu = ({
  ignoreCTA,
  disabled,
  release,
  setSelectedAction,
  documents,
}: ReleaseMenuProps) => {
  const releaseMenuDisabled = !release || disabled
  const {t} = useTranslation(releasesLocaleNamespace)
  const {mode} = useReleasesUpsell()
  const {archive, unarchive, deleteRelease, publishRelease, schedule} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()
  const [hasArchivePermission, setHasArchivePermission] = useState<boolean | null>(null)
  const [hasUnarchivePermission, setHasUnarchivePermission] = useState<boolean | null>(null)
  const [hasDeletePermission, setHasDeletePermission] = useState<boolean | null>(null)
  const [hasPublishPermission, setHasPublishPermission] = useState<boolean | null>(null)
  const [hasSchedulePermission, setHasSchedulePermission] = useState<boolean | null>(null)

  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true

    if (!releaseMenuDisabled) {
      if (release.state !== 'published') {
        if (release.state === 'archived') {
          checkWithPermissionGuard(unarchive, release._id).then((hasPermission) => {
            if (isMounted.current) setHasUnarchivePermission(hasPermission)
          })
        } else {
          checkWithPermissionGuard(archive, release._id).then((hasPermission) => {
            if (isMounted.current) setHasArchivePermission(hasPermission)
          })

          checkWithPermissionGuard(publishRelease, release._id).then((hasPermission) => {
            if (isMounted.current) setHasPublishPermission(hasPermission)
          })
          checkWithPermissionGuard(schedule, release._id, new Date()).then((hasPermission) => {
            if (isMounted.current) setHasSchedulePermission(hasPermission)
          })
        }
      }

      if (release.state === 'archived' || release.state == 'published') {
        checkWithPermissionGuard(deleteRelease, release._id).then((hasPermission) => {
          if (isMounted.current) setHasDeletePermission(hasPermission)
        })
      }
    }

    return () => {
      isMounted.current = false
    }
  }, [
    release._id,
    mode,
    releaseMenuDisabled,
    release.state,
    checkWithPermissionGuard,
    unarchive,
    archive,
    deleteRelease,
    release.metadata.releaseType,
    publishRelease,
    schedule,
  ])

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
          disabled={mode === 'disabled' || !hasUnarchivePermission}
          onClick={handleOnInitiateAction}
          icon={UnarchiveIcon}
          text={t('action.unarchive')}
          data-testid="unarchive-release-menu-item"
          tooltipProps={{
            content: !hasUnarchivePermission && t('permissions.error.unarchive'),
          }}
        />
      )

    return (
      <MenuItem
        tooltipProps={{
          disabled: hasArchivePermission
            ? !['scheduled', 'scheduling'].includes(release.state) || disabled
            : false,
          content: hasArchivePermission
            ? t('action.archive.tooltip')
            : t('permissions.error.archive'),
        }}
        data-value="archive"
        onClick={handleOnInitiateAction}
        icon={ArchiveIcon}
        text={t('action.archive')}
        data-testid="archive-release-menu-item"
        disabled={['scheduled', 'scheduling'].includes(release.state) || !hasArchivePermission}
      />
    )
  }, [
    release.state,
    mode,
    hasUnarchivePermission,
    handleOnInitiateAction,
    t,
    hasArchivePermission,
    disabled,
  ])

  const deleteMenuItem = useMemo(() => {
    if (release.state !== 'archived' && release.state !== 'published') return null

    return (
      <MenuItem
        data-value="delete"
        onClick={handleOnInitiateAction}
        disabled={releaseMenuDisabled || !hasDeletePermission}
        icon={TrashIcon}
        text={t('action.delete-release')}
        data-testid="delete-release-menu-item"
        tooltipProps={{
          content: !hasDeletePermission && t('permissions.error.delete'),
        }}
      />
    )
  }, [handleOnInitiateAction, hasDeletePermission, release.state, releaseMenuDisabled, t])

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

  const scheduleMenuItem = useMemo(() => {
    // will not return the action for scheduled releases since the main action is already schedule
    if (release.state !== 'active' || (ignoreCTA && release.metadata.releaseType === 'scheduled'))
      return null

    return (
      <ReleaseScheduleButton
        disabled={releaseMenuDisabled || !hasSchedulePermission}
        release={release}
        documents={documents}
        isMenuItem
        onConfirmDialogClose={() => setSelectedAction(undefined)}
        onConfirmDialogOpen={() => setSelectedAction('schedule')}
      />
    )
  }, [documents, hasSchedulePermission, ignoreCTA, release, releaseMenuDisabled, setSelectedAction])

  const publishMenuItem = useMemo(() => {
    if (release.state !== 'active' || (ignoreCTA && release.metadata.releaseType !== 'scheduled'))
      return null

    return (
      <ReleasePublishAllButton
        release={release}
        documents={documents}
        disabled={releaseMenuDisabled || !hasPublishPermission}
        isMenuItem
        onConfirmDialogClose={() => setSelectedAction(undefined)}
        onConfirmDialogOpen={() => setSelectedAction('publish')}
      />
    )
  }, [documents, hasPublishPermission, ignoreCTA, release, releaseMenuDisabled, setSelectedAction])

  const ActionsOrder = useMemo(() => {
    if (release.metadata.releaseType === 'scheduled') {
      return (
        <>
          {scheduleMenuItem}
          {publishMenuItem}
        </>
      )
    }

    return (
      <>
        {publishMenuItem}
        {scheduleMenuItem}
      </>
    )
  }, [release.metadata.releaseType, publishMenuItem, scheduleMenuItem])

  return (
    <>
      {unscheduleMenuItem}
      {ActionsOrder}
      {archiveUnarchiveMenuItem}
      {deleteMenuItem}
    </>
  )
}

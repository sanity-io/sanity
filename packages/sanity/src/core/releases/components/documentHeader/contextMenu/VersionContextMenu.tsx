import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon, ClockIcon, CopyIcon, PlayIcon, TrashIcon} from '@sanity/icons'
import {Menu, MenuDivider, Spinner, Stack, useToast} from '@sanity/ui'
import {memo, useCallback, useEffect, useRef, useState} from 'react'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'

import {MenuGroup} from '../../../../../ui-components/menuGroup/MenuGroup'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useDocumentPairPermissions} from '../../../../store/_legacy/grants/documentPairPermissions'
import {getPublishedId, isPublishedId} from '../../../../util/draftUtils'
import {useScheduleDraftOperations} from '../../../hooks/useScheduleDraftOperations'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {useReleasePermissions} from '../../../store/useReleasePermissions'
import {getReleaseDefaults, isReleaseScheduledOrScheduling} from '../../../util/util'
import {CreateReleaseMenuItem} from '../../CreateReleaseMenuItem'
import {VersionContextMenuItem} from './VersionContextMenuItem'

const ReleasesList = styled(Stack)`
  max-width: 300px;
  max-height: 200px;
  overflow-y: auto;
`

export const VersionContextMenu = memo(function VersionContextMenu(props: {
  documentId: string
  releases: ReleaseDocument[]
  releasesLoading: boolean
  fromRelease: string
  isVersion: boolean
  onDiscard: () => void
  onCreateRelease: () => void
  onCreateVersion: (targetId: string) => void
  disabled?: boolean
  locked?: boolean
  type: string
  isGoingToUnpublish?: boolean
  release?: ReleaseDocument
  onChangeSchedule?: () => void
}) {
  const {
    documentId,
    releases,
    releasesLoading,
    fromRelease,
    isVersion,
    onDiscard,
    onCreateRelease,
    onCreateVersion,
    disabled,
    locked,
    type,
    isGoingToUnpublish = false,
    release,
    onChangeSchedule,
  } = props
  const {t} = useTranslation()
  const toast = useToast()
  const isPublished = isPublishedId(documentId) && !isVersion
  const optionsReleaseList = releases.filter((r) => !isReleaseScheduledOrScheduling(r))

  const {checkWithPermissionGuard} = useReleasePermissions()
  const {createRelease} = useReleaseOperations()
  const {runNow, deleteSchedule} = useScheduleDraftOperations()
  const [hasCreatePermission, setHasCreatePermission] = useState<boolean | null>(null)
  const [isRunningNow, setIsRunningNow] = useState(false)
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false)

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id: getPublishedId(documentId),
    type,
    version: isVersion ? fromRelease : undefined,
    // Note: the result of this discard permission check is disregarded for the published document
    // version. Discarding is never available for the published document version. Therefore, the
    // parameters provided here are not configured to handle published document versions.
    permission: fromRelease === 'draft' ? 'discardDraft' : 'discardVersion',
  })
  const hasDiscardPermission = !isPermissionsLoading && permissions?.granted

  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true

    checkWithPermissionGuard(createRelease, getReleaseDefaults()).then((hasPermission) => {
      if (isMounted.current) setHasCreatePermission(hasPermission)
    })

    return () => {
      isMounted.current = false
    }
  }, [checkWithPermissionGuard, createRelease])

  // Check if this is a scheduled draft (cardinality 'one' release)
  const isScheduledDraft = release && release.metadata.cardinality === 'one'

  const handleRunNow = useCallback(async () => {
    if (!release) return

    setIsRunningNow(true)
    try {
      await runNow(release._id)

      // Show success toast
      toast.push({
        closable: true,
        status: 'success',
        title: t('release.toast.run-now.success', {
          title: release.metadata.title || t('release.placeholder-untitled-release'),
        }),
      })
    } catch (error) {
      console.error('Failed to run scheduled draft:', error)

      // Show error toast
      toast.push({
        closable: true,
        status: 'error',
        title: t('release.toast.run-now.error', {
          title: release.metadata.title || t('release.placeholder-untitled-release'),
          error: error.message,
        }),
      })
    } finally {
      setIsRunningNow(false)
    }
  }, [release, runNow, toast, t])

  const handleDeleteSchedule = useCallback(async () => {
    if (!release) return

    setIsDeletingSchedule(true)
    try {
      await deleteSchedule(release._id)

      // Show success toast
      toast.push({
        closable: true,
        status: 'success',
        title: t('release.toast.delete-schedule.success', {
          title: release.metadata.title || t('release.placeholder-untitled-release'),
        }),
      })
    } catch (error) {
      console.error('Failed to delete scheduled draft:', error)

      // Show error toast
      toast.push({
        closable: true,
        status: 'error',
        title: t('release.toast.delete-schedule.error', {
          title: release.metadata.title || t('release.placeholder-untitled-release'),
          error: error.message,
        }),
      })
    } finally {
      setIsDeletingSchedule(false)
    }
  }, [release, deleteSchedule, toast, t])

  // For scheduled drafts, show different menu items
  // Note: For scheduled drafts (cardinality 'one'), we ignore the locked state
  // since these special releases can still perform actions even when scheduled
  if (isScheduledDraft && isVersion) {
    return (
      <Menu>
        <MenuItem
          icon={isRunningNow ? Spinner : PlayIcon}
          onClick={handleRunNow}
          text={t('release.action.run-now')}
          disabled={disabled || isRunningNow || isDeletingSchedule}
        />
        <MenuItem
          icon={ClockIcon}
          text={t('release.action.change-schedule')}
          disabled={disabled || isRunningNow || isDeletingSchedule}
          onClick={onChangeSchedule}
        />
        <MenuDivider />
        <MenuGroup
          icon={CopyIcon}
          popover={{placement: 'right-start'}}
          text={t('release.action.copy-to')}
          disabled={
            disabled ||
            !hasCreatePermission ||
            isGoingToUnpublish ||
            isRunningNow ||
            isDeletingSchedule
          }
          tooltipProps={{
            disabled: hasCreatePermission === true,
            content: t('release.action.permission.error'),
          }}
          data-testid="copy-version-to-release-button-group"
        >
          <ReleasesList key={fromRelease} space={1}>
            {optionsReleaseList.map((targetRelease) => {
              return (
                <MenuItem
                  key={targetRelease._id}
                  as="a"
                  onClick={() => onCreateVersion(targetRelease._id)}
                  renderMenuItem={() => <VersionContextMenuItem release={targetRelease} />}
                />
              )
            })}
          </ReleasesList>{' '}
          {optionsReleaseList.length > 1 && <MenuDivider />}
          <CreateReleaseMenuItem onCreateRelease={onCreateRelease} />
        </MenuGroup>
        <MenuDivider />
        <MenuItem
          icon={isDeletingSchedule ? Spinner : TrashIcon}
          onClick={handleDeleteSchedule}
          text={t('release.action.delete-schedule')}
          tone="critical"
          disabled={disabled || isRunningNow || isDeletingSchedule}
        />
      </Menu>
    )
  }

  // Default menu for regular releases
  return (
    <>
      <Menu>
        {isVersion && (
          <IntentLink
            intent="release"
            params={{id: fromRelease}}
            rel="noopener noreferrer"
            style={{textDecoration: 'none'}}
            disabled={disabled}
          >
            <MenuItem icon={CalendarIcon} text={t('release.action.view-release')} />
          </IntentLink>
        )}
        {releasesLoading && <Spinner />}
        <MenuGroup
          icon={CopyIcon}
          popover={{placement: 'right-start'}}
          text={t('release.action.copy-to')}
          disabled={disabled || !hasCreatePermission || isGoingToUnpublish}
          tooltipProps={{
            disabled: hasCreatePermission === true,
            content: t('release.action.permission.error'),
          }}
          data-testid="copy-version-to-release-button-group"
        >
          <ReleasesList key={fromRelease} space={1}>
            {optionsReleaseList.map((targetRelease) => {
              return (
                <MenuItem
                  key={targetRelease._id}
                  as="a"
                  onClick={() => onCreateVersion(targetRelease._id)}
                  renderMenuItem={() => <VersionContextMenuItem release={targetRelease} />}
                />
              )
            })}
          </ReleasesList>{' '}
          {optionsReleaseList.length > 1 && <MenuDivider />}
          <CreateReleaseMenuItem onCreateRelease={onCreateRelease} />
        </MenuGroup>
        {!isPublished && (
          <>
            <MenuDivider />
            <MenuItem
              icon={TrashIcon}
              onClick={onDiscard}
              text={t('release.action.discard-version')}
              disabled={disabled || locked || !hasDiscardPermission}
              tooltipProps={{
                disabled: hasDiscardPermission === true,
                content: t('release.action.permission.error'),
              }}
            />
          </>
        )}
      </Menu>
    </>
  )
})

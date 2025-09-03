import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon, ClockIcon, CopyIcon, PlayIcon, TrashIcon} from '@sanity/icons'
import {Menu, MenuDivider, Spinner, Stack, Text, useToast} from '@sanity/ui'
import {memo, type ReactNode, useCallback, useEffect, useRef, useState} from 'react'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'

import {Dialog} from '../../../../../ui-components/dialog/Dialog'
import {MenuGroup} from '../../../../../ui-components/menuGroup/MenuGroup'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {Translate, useTranslation} from '../../../../i18n'
import {useDocumentPairPermissions} from '../../../../store/_legacy/grants/documentPairPermissions'
import {getPublishedId, isPublishedId} from '../../../../util/draftUtils'
import {useScheduleDraftOperationsWithToasts} from '../../../hooks/useScheduleDraftOperationsWithToasts'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {useReleasePermissions} from '../../../store/useReleasePermissions'
import {useBundleDocuments} from '../../../tool/detail/useBundleDocuments'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
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

  const [hasCreatePermission, setHasCreatePermission] = useState<boolean | null>(null)
  const [isRunningNow, setIsRunningNow] = useState(false)
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'run-now' | 'delete-schedule' | null>(null)

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

  const scheduledDraftTitle = release?.metadata.title || t('release.placeholder-untitled-release')

  // Get the documents in this release to show the document title for "run now" action
  const releaseId = release ? getReleaseIdFromReleaseDocumentId(release._id) : null
  const {results: documents} = useBundleDocuments(releaseId || '')
  const firstDocument = documents?.[0]?.document

  const {runNow, deleteSchedule} = useScheduleDraftOperationsWithToasts(scheduledDraftTitle)

  // Get the document title for confirmation dialogs
  // For "run now" we want the actual document title, for "delete schedule" we want the release title
  const actualDocumentTitle = firstDocument?.title || firstDocument?.name || scheduledDraftTitle

  const handleRunNow = useCallback(async () => {
    if (!release) return

    setIsRunningNow(true)
    try {
      await runNow(release._id)
    } catch (error) {
      // Error toast already handled by handleRunNowOperation
    } finally {
      setIsRunningNow(false)
    }
  }, [release, runNow])

  const handleDeleteSchedule = useCallback(async () => {
    if (!release) return

    setIsDeletingSchedule(true)
    try {
      await deleteSchedule(release._id)
    } catch (error) {
      // Error toast already handled by handleDeleteScheduleOperation
    } finally {
      setIsDeletingSchedule(false)
    }
  }, [release, deleteSchedule])

  const handleConfirmAction = useCallback(async () => {
    if (confirmAction === 'run-now') {
      await handleRunNow()
    } else if (confirmAction === 'delete-schedule') {
      await handleDeleteSchedule()
    }
    setConfirmAction(null)
  }, [confirmAction, handleRunNow, handleDeleteSchedule])

  // For scheduled drafts, show different menu items
  // Note: For scheduled drafts (cardinality 'one'), we ignore the locked state
  // since these special releases can still perform actions even when scheduled
  if (isScheduledDraft && isVersion) {
    return (
      <>
        <Menu>
          <MenuItem
            icon={isRunningNow ? Spinner : PlayIcon}
            onClick={() => setConfirmAction('run-now')}
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
            onClick={() => setConfirmAction('delete-schedule')}
            text={t('release.action.delete-schedule')}
            tone="critical"
            disabled={disabled || isRunningNow || isDeletingSchedule}
          />
        </Menu>

        {/* Confirmation Dialog for scheduled draft actions */}
        {confirmAction && (
          <Dialog
            id={`confirm-${confirmAction}-dialog`}
            data-testid={`confirm-${confirmAction}-dialog`}
            header={confirmAction === 'run-now' ? 'Run draft now' : 'Delete schedule'}
            onClose={() => setConfirmAction(null)}
            width={1}
            footer={{
              confirmButton: {
                text: confirmAction === 'run-now' ? 'Yes, run now' : 'Yes, delete',
                tone: confirmAction === 'run-now' ? 'primary' : 'critical',
                onClick: handleConfirmAction,
                loading: isRunningNow || isDeletingSchedule,
                disabled: isRunningNow || isDeletingSchedule,
              },
              cancelButton: {
                disabled: isRunningNow || isDeletingSchedule,
              },
            }}
          >
            <Text>
              <Translate
                t={t}
                i18nKey={
                  confirmAction === 'run-now'
                    ? 'release.dialog.run-now.confirm-message'
                    : 'release.dialog.delete-schedule.confirm-message'
                }
                values={{
                  title: String(
                    confirmAction === 'run-now' ? actualDocumentTitle : scheduledDraftTitle,
                  ),
                }}
                components={{
                  Strong: ({children}: {children?: ReactNode}) => <strong>{children}</strong>,
                }}
              />
            </Text>
          </Dialog>
        )}
      </>
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

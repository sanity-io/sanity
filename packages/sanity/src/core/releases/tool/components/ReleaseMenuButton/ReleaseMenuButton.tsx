import {EllipsisHorizontalIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Menu, Spinner, Stack, Text, useClickOutsideEvent, useToast} from '@sanity/ui'
import {type SetStateAction, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useRouter} from 'sanity/router'

import {Button, Dialog, Popover} from '../../../../../ui-components'
import {Translate, useTranslation} from '../../../../i18n'
import {usePerspective} from '../../../../perspective/usePerspective'
import {useSetPerspective} from '../../../../perspective/useSetPerspective'
import {useReleasesUpsell} from '../../../contexts/upsell/useReleasesUpsell'
import {releasesLocaleNamespace} from '../../../i18n'
import {isReleaseLimitError} from '../../../store/isReleaseLimitError'
import {type ReleaseDocument} from '../../../store/types'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {type DocumentInRelease} from '../../detail/useBundleDocuments'
import {RELEASE_ACTION_MAP, type ReleaseAction} from './releaseActions'
import {ReleaseMenu} from './ReleaseMenu'
import {ReleasePreviewCard} from './ReleasePreviewCard'

export type ReleaseMenuButtonProps = {
  /** defaults to false
   * set true if release primary CTA options should not
   * be shown in the menu eg. unschedule, publish
   */
  ignoreCTA?: boolean
  release: ReleaseDocument
  documentsCount: number
  documents?: DocumentInRelease[]
}

export const ReleaseMenuButton = ({
  ignoreCTA,
  release,
  documentsCount,
  documents,
}: ReleaseMenuButtonProps) => {
  const toast = useToast()
  const router = useRouter()
  const {archive, unarchive, deleteRelease, unschedule} = useReleaseOperations()

  const [isPerformingOperation, setIsPerformingOperation] = useState(false)
  const [selectedAction, setSelectedAction] = useState<ReleaseAction>()
  const {selectedReleaseId} = usePerspective()
  const setPerspective = useSetPerspective()

  const popoverRef = useRef<HTMLDivElement | null>(null)
  const releaseMenuRef = useRef<HTMLDivElement | null>(null)
  const [openPopover, setOpenPopover] = useState(false)

  const releaseMenuDisabled = !release
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const telemetry = useTelemetry()
  const {guardWithReleaseLimitUpsell} = useReleasesUpsell()
  const releaseTitle = release.metadata.title || tCore('release.placeholder-untitled-release')
  const isActionPublishOrSchedule = selectedAction === 'publish' || selectedAction === 'schedule'

  const handleDelete = useCallback(async () => {
    await deleteRelease(release._id)

    // return to release overview list now that release is deleted
    router.navigate({})
  }, [deleteRelease, release._id, router])

  const handleUnarchive = useCallback(async () => {
    return guardWithReleaseLimitUpsell(() => unarchive(release._id), true)
  }, [guardWithReleaseLimitUpsell, release._id, unarchive])

  const handleAction = useCallback(
    async (action: ReleaseAction) => {
      if (action === 'publish' || action === 'schedule') return
      if (releaseMenuDisabled) return

      const actionLookup = {
        delete: handleDelete,
        archive,
        unarchive: handleUnarchive,
        unschedule,
      }
      const actionValues = RELEASE_ACTION_MAP[action]

      try {
        if (
          (action === 'archive' || action === 'delete') &&
          selectedReleaseId === getReleaseIdFromReleaseDocumentId(release._id)
        ) {
          // Reset the perspective to drafts when the release is archived or deleted
          // To avoid showing the release archived / deleted toast.
          setPerspective('drafts')
        }
        setIsPerformingOperation(true)
        await actionLookup[action](release._id)

        telemetry.log(actionValues.telemetry)

        if (typeof actionValues.toastSuccessI18nKey !== 'undefined') {
          toast.push({
            closable: true,
            status: 'success',
            title: (
              <Text muted size={1}>
                <Translate
                  t={t}
                  i18nKey={actionValues.toastSuccessI18nKey}
                  values={{title: releaseTitle}}
                />
              </Text>
            ),
          })
        }
      } catch (actionError) {
        if (isReleaseLimitError(actionError)) return

        if (typeof actionValues.toastFailureI18nKey !== 'undefined') {
          toast.push({
            status: 'error',
            title: (
              <Text muted size={1}>
                <Translate
                  t={t}
                  i18nKey={actionValues.toastFailureI18nKey}
                  values={{title: releaseTitle, error: actionError.toString()}}
                />
              </Text>
            ),
          })
        }
        console.error(actionError)
      } finally {
        setIsPerformingOperation(false)
        setSelectedAction(undefined)
      }
    },
    [
      releaseMenuDisabled,
      handleDelete,
      archive,
      handleUnarchive,
      unschedule,
      telemetry,
      toast,
      t,
      releaseTitle,
      selectedReleaseId,
      setPerspective,
      release._id,
    ],
  )

  /** in some instanced, immediately execute the action without requiring confirmation */
  useEffect(() => {
    if (!selectedAction || isActionPublishOrSchedule) return

    if (!RELEASE_ACTION_MAP[selectedAction].confirmDialog) handleAction(selectedAction)
  }, [documentsCount, handleAction, isActionPublishOrSchedule, selectedAction])

  const confirmActionDialog = useMemo(() => {
    if (!selectedAction || isActionPublishOrSchedule) return null

    const {confirmDialog} = RELEASE_ACTION_MAP[selectedAction]

    if (!confirmDialog) return null

    return (
      <Dialog
        id={confirmDialog.dialogId}
        data-testid={confirmDialog.dialogId}
        header={t(confirmDialog.dialogHeaderI18nKey)}
        onClose={() => !isPerformingOperation && setSelectedAction(undefined)}
        padding={false}
        footer={{
          confirmButton: {
            text: t(confirmDialog.dialogConfirmButtonI18nKey),
            tone: confirmDialog.confirmButtonTone,
            onClick: () => handleAction(selectedAction),
            loading: isPerformingOperation,
            disabled: isPerformingOperation,
          },
          cancelButton: {
            disabled: isPerformingOperation,
          },
        }}
      >
        <Stack space={4} paddingX={4} paddingBottom={4}>
          <ReleasePreviewCard release={release} />
          {!!documentsCount && (
            <Text muted size={1}>
              <Translate
                t={t}
                i18nKey={confirmDialog.dialogDescriptionI18nKey}
                values={{
                  count: documentsCount,
                }}
              />
            </Text>
          )}
        </Stack>
      </Dialog>
    )
  }, [
    selectedAction,
    isActionPublishOrSchedule,
    t,
    isPerformingOperation,
    release,
    documentsCount,
    handleAction,
  ])

  const handleOnButtonClick = () => {
    if (openPopover) closePopover()
    else setOpenPopover(true)
  }

  const closePopover = () => {
    setOpenPopover(false)
  }

  useClickOutsideEvent(
    () => {
      if (!isActionPublishOrSchedule) {
        closePopover()
      }
    },
    () => [popoverRef.current, releaseMenuRef.current],
  )

  const handleSetSelectedAction = useCallback(
    (action: SetStateAction<ReleaseAction | undefined>) => {
      if (!action) closePopover()
      setSelectedAction(action)
    },
    [],
  )

  return (
    <>
      <Popover
        content={
          <Menu ref={releaseMenuRef}>
            <ReleaseMenu
              ignoreCTA={ignoreCTA}
              release={release}
              setSelectedAction={handleSetSelectedAction}
              disabled={isPerformingOperation}
              documents={documents ?? []}
            />
          </Menu>
        }
        open={openPopover}
        ref={popoverRef}
        constrainSize={false}
        fallbackPlacements={['top-end']}
        portal
        tone="default"
        placement="bottom"
      >
        <Button
          disabled={releaseMenuDisabled || isPerformingOperation}
          icon={isPerformingOperation ? Spinner : EllipsisHorizontalIcon}
          mode="bleed"
          tooltipProps={{content: t('menu.tooltip')}}
          aria-label={t('menu.label')}
          data-testid="release-menu-button"
          onClick={handleOnButtonClick}
        />
      </Popover>
      {confirmActionDialog}
    </>
  )
}

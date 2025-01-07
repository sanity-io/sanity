import {EllipsisHorizontalIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Menu, Spinner, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useRouter} from 'sanity/router'

import {Button, Dialog, MenuButton} from '../../../../../ui-components'
import {Translate, useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {type ReleaseDocument} from '../../../store/types'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {RELEASE_ACTION_MAP, type ReleaseAction} from './releaseActions'
import {ReleaseMenu} from './ReleaseMenu'

export type ReleaseMenuButtonProps = {
  /** defaults to false
   * set true if release primary CTA options should not
   * be shown in the menu eg. unschedule, publish
   */
  ignoreCTA?: boolean
  release: ReleaseDocument
}

export const ReleaseMenuButton = ({ignoreCTA, release}: ReleaseMenuButtonProps) => {
  const toast = useToast()
  const router = useRouter()
  const {archive, unarchive, deleteRelease, unschedule} = useReleaseOperations()

  const [isPerformingOperation, setIsPerformingOperation] = useState(false)
  const [selectedAction, setSelectedAction] = useState<ReleaseAction>()
  const [releaseDocumentsCount, setReleaseDocumentsCount] = useState<number>()

  const releaseMenuDisabled = !release
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const telemetry = useTelemetry()
  const releaseTitle = release.metadata.title || tCore('release.placeholder-untitled-release')

  const handleDelete = useCallback(async () => {
    await deleteRelease(release._id)

    // return to release overview list now that release is deleted
    router.navigate({})
  }, [deleteRelease, release._id, router])

  const handleAction = useCallback(
    async (action: ReleaseAction) => {
      if (releaseMenuDisabled) return

      const actionLookup = {
        delete: handleDelete,
        archive,
        unarchive,
        unschedule,
      }
      const actionValues = RELEASE_ACTION_MAP[action]

      try {
        setIsPerformingOperation(true)
        await actionLookup[action](release._id)
        telemetry.log(actionValues.telemetry)
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
      } catch (actionError) {
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
      unarchive,
      unschedule,
      release._id,
      telemetry,
      toast,
      t,
      releaseTitle,
    ],
  )

  const confirmActionDialog = useMemo(() => {
    if (!selectedAction) return null

    const {confirmDialog} = RELEASE_ACTION_MAP[selectedAction]

    if (!confirmDialog) return null

    const dialogDescription =
      releaseDocumentsCount === 1
        ? confirmDialog.dialogDescriptionSingularI18nKey
        : confirmDialog.dialogDescriptionMultipleI18nKey

    return (
      <Dialog
        id={confirmDialog.dialogId}
        data-testid={confirmDialog.dialogId}
        header={t(confirmDialog.dialogHeaderI18nKey, {title: releaseTitle})}
        onClose={() => setSelectedAction(undefined)}
        footer={{
          confirmButton: {
            text: t(confirmDialog.dialogConfirmButtonI18nKey),
            tone: 'positive',
            onClick: () => handleAction(selectedAction),
            loading: isPerformingOperation,
            disabled: isPerformingOperation,
          },
        }}
      >
        <Text muted size={1}>
          {
            <Translate
              t={t}
              i18nKey={dialogDescription}
              values={{
                count: releaseDocumentsCount,
              }}
            />
          }
        </Text>
      </Dialog>
    )
  }, [handleAction, isPerformingOperation, releaseTitle, releaseDocumentsCount, selectedAction, t])

  return (
    <>
      <MenuButton
        button={
          <Button
            disabled={releaseMenuDisabled || isPerformingOperation}
            icon={isPerformingOperation ? Spinner : EllipsisHorizontalIcon}
            mode="bleed"
            tooltipProps={{content: t('menu.tooltip')}}
            aria-label={t('menu.label')}
            data-testid="release-menu-button"
          />
        }
        id="release-menu"
        menu={
          <Menu>
            <ReleaseMenu
              ignoreCTA={ignoreCTA}
              release={release}
              setSelectedAction={setSelectedAction}
              setReleaseDocumentsCount={setReleaseDocumentsCount}
            />
          </Menu>
        }
        popover={{
          constrainSize: true,
          fallbackPlacements: ['top-end'],
          placement: 'bottom',
          portal: true,
          tone: 'default',
        }}
      />
      {confirmActionDialog}
    </>
  )
}

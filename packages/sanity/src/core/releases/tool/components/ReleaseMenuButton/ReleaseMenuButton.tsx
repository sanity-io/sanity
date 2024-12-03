import {ArchiveIcon, EllipsisHorizontalIcon, UnarchiveIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Menu, Spinner, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Button, Dialog, MenuButton, MenuItem} from '../../../../../ui-components'
import {Translate, useTranslation} from '../../../../i18n'
import {ArchivedRelease} from '../../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../../i18n'
import {type ReleaseDocument} from '../../../store/types'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {useBundleDocuments} from '../../detail/useBundleDocuments'

export type ReleaseMenuButtonProps = {
  disabled?: boolean
  release: ReleaseDocument
}

const ARCHIVABLE_STATES = ['active', 'published']

export const ReleaseMenuButton = ({disabled, release}: ReleaseMenuButtonProps) => {
  const toast = useToast()
  const {archive} = useReleaseOperations()
  const {loading: isLoadingReleaseDocuments, results: releaseDocuments} = useBundleDocuments(
    getReleaseIdFromReleaseDocumentId(release._id),
  )
  const [isPerformingOperation, setIsPerformingOperation] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'edit' | 'confirm-archive'>()

  const releaseMenuDisabled = !release || isLoadingReleaseDocuments || disabled
  const {t} = useTranslation(releasesLocaleNamespace)
  const telemetry = useTelemetry()

  const handleArchive = useCallback(async () => {
    if (releaseMenuDisabled) return

    try {
      setIsPerformingOperation(true)
      await archive(release._id)

      // it's in the process of becoming true, so the event we want to track is archive
      telemetry.log(ArchivedRelease)
      toast.push({
        closable: true,
        status: 'success',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="toast.archive.success"
              values={{title: release.metadata.title}}
            />
          </Text>
        ),
      })
    } catch (archivingError) {
      toast.push({
        status: 'error',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="toast.archive.error"
              values={{title: release.metadata.title, error: archivingError.toString()}}
            />
          </Text>
        ),
      })
      console.error(archivingError)
    } finally {
      setIsPerformingOperation(false)
      setSelectedAction(undefined)
    }
  }, [archive, release._id, release.metadata.title, releaseMenuDisabled, t, telemetry, toast])

  const handleUnarchive = async () => {
    // noop
    // TODO: similar to handleArchive - complete once server action exists
  }

  const confirmArchiveDialog = useMemo(() => {
    if (selectedAction !== 'confirm-archive') return null

    const dialogDescription =
      releaseDocuments.length === 1
        ? 'archive-dialog.confirm-archive-description_one'
        : 'archive-dialog.confirm-archive-description_other'

    return (
      <Dialog
        id="confirm-archive-dialog"
        data-testid="confirm-archive-dialog"
        header={
          <Translate
            t={t}
            i18nKey={'archive-dialog.confirm-archive-title'}
            values={{
              title: release.metadata.title,
            }}
          />
        }
        onClose={() => setSelectedAction(undefined)}
        footer={{
          confirmButton: {
            text: t('archive-dialog.confirm-archive-button'),
            tone: 'positive',
            onClick: handleArchive,
            loading: isPerformingOperation,
            disabled: isPerformingOperation,
          },
        }}
      >
        <Text muted size={1}>
          <Translate
            t={t}
            i18nKey={dialogDescription}
            values={{
              count: releaseDocuments.length,
            }}
          />
        </Text>
      </Dialog>
    )
  }, [
    handleArchive,
    isPerformingOperation,
    release.metadata.title,
    releaseDocuments.length,
    selectedAction,
    t,
  ])

  const handleOnInitiateArchive = useCallback(() => {
    if (releaseDocuments.length > 0) {
      setSelectedAction('confirm-archive')
    } else {
      handleArchive()
    }
  }, [handleArchive, releaseDocuments.length])

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
            {!release?.state || release.state === 'archived' ? (
              <MenuItem
                onClick={handleUnarchive}
                // TODO: disabled as CL action not yet impl
                disabled
                icon={UnarchiveIcon}
                text={t('action.unarchive')}
                data-testid="unarchive-release"
              />
            ) : (
              <MenuItem
                tooltipProps={{
                  disabled: ARCHIVABLE_STATES.includes(release.state) || isPerformingOperation,
                  content: t('action.archive.tooltip'),
                }}
                onClick={handleOnInitiateArchive}
                icon={ArchiveIcon}
                text={t('action.archive')}
                data-testid="archive-release"
                disabled={!ARCHIVABLE_STATES.includes(release.state)}
              />
            )}
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
      {confirmArchiveDialog}
    </>
  )
}

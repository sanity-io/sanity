import {ArchiveIcon, EditIcon, EllipsisHorizontalIcon, UnarchiveIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Menu, Spinner} from '@sanity/ui'
import {useState} from 'react'

import {Button, MenuButton, MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {type ReleaseDocument} from '../../../../store/release/types'
import {useReleaseOperations} from '../../../../store/release/useReleaseOperations'
import {ArchivedRelease, UnarchivedRelease} from '../../../__telemetry__/releases.telemetry'
import {ReleaseDetailsDialog} from '../../../components/dialog/ReleaseDetailsDialog'
import {releasesLocaleNamespace} from '../../../i18n'

export type ReleaseMenuButtonProps = {
  disabled?: boolean
  release?: ReleaseDocument
}

export const ReleaseMenuButton = ({disabled, release}: ReleaseMenuButtonProps) => {
  const {updateRelease} = useReleaseOperations()
  const isBundleArchived = release?.state === 'archived'
  const [isPerformingOperation, setIsPerformingOperation] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'edit'>()

  const releaseMenuDisabled = !release || disabled
  const {t} = useTranslation(releasesLocaleNamespace)
  const telemetry = useTelemetry()

  const resetSelectedAction = () => setSelectedAction(undefined)

  const handleOnToggleArchive = async () => {
    if (releaseMenuDisabled) return

    setIsPerformingOperation(true)
    await updateRelease({
      ...release,
      state: isBundleArchived ? 'active' : 'archived',
      metadata: {
        ...release.metadata,
        archivedAt: isBundleArchived ? undefined : new Date().toISOString(),
      },
    })

    if (isBundleArchived) {
      // it's in the process of becoming false, so the event we want to track is unarchive
      telemetry.log(UnarchivedRelease)
    } else {
      // it's in the process of becoming true, so the event we want to track is archive
      telemetry.log(ArchivedRelease)
    }
    setIsPerformingOperation(false)
  }

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
            <MenuItem
              onClick={() => setSelectedAction('edit')}
              icon={EditIcon}
              text={t('action.edit')}
              data-testid="edit-release"
            />
            <MenuItem
              onClick={handleOnToggleArchive}
              icon={isBundleArchived ? UnarchiveIcon : ArchiveIcon}
              text={isBundleArchived ? t('action.unarchive') : t('action.archive')}
              data-testid="archive-release"
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
      {selectedAction === 'edit' && (
        <ReleaseDetailsDialog
          onCancel={resetSelectedAction}
          onSubmit={resetSelectedAction}
          release={release}
        />
      )}
    </>
  )
}

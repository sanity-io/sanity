import {ArchiveIcon, EditIcon, EllipsisHorizontalIcon, UnarchiveIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Menu, Spinner} from '@sanity/ui'
import {useState} from 'react'

import {Button, MenuButton, MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {type BundleDocument} from '../../../../store/bundles/types'
import {useBundleOperations} from '../../../../store/bundles/useBundleOperations'
import {ArchivedRelease, UnarchivedRelease} from '../../../__telemetry__/releases.telemetry'
import {ReleaseDetailsDialog} from '../../../components/dialog/ReleaseDetailsDialog'
import {releasesLocaleNamespace} from '../../../i18n'

export type ReleaseMenuButtonProps = {
  disabled?: boolean
  bundle?: BundleDocument
}

export const ReleaseMenuButton = ({disabled, bundle}: ReleaseMenuButtonProps) => {
  const {updateBundle} = useBundleOperations()
  const isBundleArchived = !!bundle?.archivedAt
  const [isPerformingOperation, setIsPerformingOperation] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'edit'>()

  const bundleMenuDisabled = !bundle || disabled
  const {t} = useTranslation(releasesLocaleNamespace)
  const telemetry = useTelemetry()

  const resetSelectedAction = () => setSelectedAction(undefined)

  const handleOnToggleArchive = async () => {
    if (bundleMenuDisabled) return

    setIsPerformingOperation(true)
    await updateBundle({
      ...bundle,
      archivedAt: isBundleArchived ? undefined : new Date().toISOString(),
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
            disabled={bundleMenuDisabled || isPerformingOperation}
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
        }}
      />
      {selectedAction === 'edit' && (
        <ReleaseDetailsDialog
          onCancel={resetSelectedAction}
          onSubmit={resetSelectedAction}
          bundle={bundle}
        />
      )}
    </>
  )
}

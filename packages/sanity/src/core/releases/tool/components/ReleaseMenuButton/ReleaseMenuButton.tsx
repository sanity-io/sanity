import {
  ArchiveIcon,
  ArrowRightIcon,
  EditIcon,
  EllipsisHorizontalIcon,
  UnarchiveIcon,
} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Flex, Menu, Spinner, Text} from '@sanity/ui'
import {useState} from 'react'

import {Button, Dialog, MenuButton, MenuItem} from '../../../../../ui-components'
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
  const {archive} = useReleaseOperations()
  const isBundleArchived = release?.state === 'archived'
  const [isPerformingOperation, setIsPerformingOperation] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'edit' | 'confirm-archive'>()

  const releaseMenuDisabled = !release || disabled
  const {t} = useTranslation(releasesLocaleNamespace)
  const telemetry = useTelemetry()

  const resetSelectedAction = () => setSelectedAction(undefined)

  const handleArchive = async () => {
    if (releaseMenuDisabled) return

    setIsPerformingOperation(true)
    await archive(release._id)

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
              onClick={() => setSelectedAction('confirm-archive')}
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
      {selectedAction === 'confirm-archive' && (
        <Dialog
          header="Confirm archiving release"
          id="create-release-dialog"
          onClose={() => setSelectedAction(undefined)}
          width={1}
        >
          <form onSubmit={handleArchive}>
            <Box padding={4}>
              {/* TODO localize string */}
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <Text>Are you sure you want to archive the release? There's no going back (yet)</Text>
            </Box>
            <Flex justify="flex-end" paddingTop={5}>
              <Button
                size="large"
                iconRight={ArrowRightIcon}
                type="submit"
                text={
                  // TODO localize string
                  // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
                  'Archive release'
                }
                data-testid="archive-release-button"
              />
            </Flex>
          </form>
        </Dialog>
      )}
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

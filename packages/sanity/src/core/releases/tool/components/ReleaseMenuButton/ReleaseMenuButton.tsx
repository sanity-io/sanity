import {ArchiveIcon, ArrowRightIcon, EllipsisHorizontalIcon, UnarchiveIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Flex, Menu, Spinner, Text} from '@sanity/ui'
import {type FormEventHandler, useState} from 'react'

import {Button, Dialog, MenuButton, MenuItem} from '../../../../../ui-components'
import {LoadingBlock} from '../../../../components/loadingBlock'
import {useTranslation} from '../../../../i18n'
import {type ReleaseDocument} from '../../../../store/release/types'
import {useReleaseOperations} from '../../../../store/release/useReleaseOperations'
import {ArchivedRelease, UnarchivedRelease} from '../../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../../i18n'

export type ReleaseMenuButtonProps = {
  disabled?: boolean
  release: ReleaseDocument
}

const ARCHIVABLE_STATES = ['active', 'published']

export const ReleaseMenuButton = ({disabled, release}: ReleaseMenuButtonProps) => {
  const {archive, unarchive} = useReleaseOperations()
  const [isPerformingOperation, setIsPerformingOperation] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'edit' | 'confirm-archive'>()

  const releaseMenuDisabled = !release || disabled
  const {t} = useTranslation(releasesLocaleNamespace)
  const telemetry = useTelemetry()

  const handleArchive = async (e: Parameters<FormEventHandler<HTMLFormElement>>[0]) => {
    if (releaseMenuDisabled) return
    e.preventDefault()

    setIsPerformingOperation(true)
    await archive(release._id)

    // it's in the process of becoming true, so the event we want to track is archive
    telemetry.log(ArchivedRelease)
    setIsPerformingOperation(false)
  }

  const handleUnarchive = async () => {
    setIsPerformingOperation(true)
    await unarchive(release._id)

    // it's in the process of becoming false, so the event we want to track is unarchive
    telemetry.log(UnarchivedRelease)
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
            {!release?.state || release.state === 'archived' ? (
              <MenuItem
                onClick={handleUnarchive}
                icon={UnarchiveIcon}
                text={t('action.unarchive')}
                data-testid="unarchive-release"
              />
            ) : (
              <MenuItem
                tooltipProps={{
                  disabled: ARCHIVABLE_STATES.includes(release.state),
                  content: t('action.archive.tooltip'),
                }}
                onClick={() => setSelectedAction('confirm-archive')}
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
              {isPerformingOperation && <LoadingBlock showText title={'archiving, wait'} />}
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
    </>
  )
}

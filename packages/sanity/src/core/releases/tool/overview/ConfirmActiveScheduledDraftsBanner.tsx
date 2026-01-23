import {type ReleaseDocument} from '@sanity/client'
import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Button} from '../../../../ui-components'
import {Translate, useTranslation} from '../../../i18n'
import {isCardinalityOneRelease} from '../../../util/releaseUtils'
import {releasesLocaleNamespace} from '../../i18n'
import {ConfirmScheduledDraftsDialog} from './ConfirmScheduledDraftsDialog'
import {type Mode} from './queryParamUtils'

interface ConfirmActiveScheduledDraftsBannerProps {
  releases: ReleaseDocument[]
  releaseGroupMode: Mode
  hasDateFilter: boolean
  onNavigateToPaused: () => void
}

/**
 * Active drafts are those with state='active' and cardinality='one'
 */
export function ConfirmActiveScheduledDraftsBanner({
  releases,
  releaseGroupMode,
  hasDateFilter,
  onNavigateToPaused,
}: ConfirmActiveScheduledDraftsBannerProps) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const activeScheduledDrafts = useMemo(
    () =>
      releases.filter((release) => release.state === 'active' && isCardinalityOneRelease(release)),
    [releases],
  )

  const shouldOpenDialog = releaseGroupMode === 'paused' && !hasDateFilter

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false)
  }, [])

  const handleClick = useCallback(
    () => (shouldOpenDialog ? setIsDialogOpen(true) : onNavigateToPaused()),
    [shouldOpenDialog, onNavigateToPaused],
  )

  if (activeScheduledDrafts.length === 0) {
    return null
  }

  const buttonText = shouldOpenDialog
    ? t('banner.confirm-active-scheduled-drafts.button-paused')
    : t('banner.confirm-active-scheduled-drafts.button')

  return (
    <>
      <Box flex="none" padding={1} marginBottom={4}>
        <Card radius={3} paddingX={2} paddingY={2} tone="caution">
          <Flex align="center" gap={3} paddingX={2}>
            <Text size={0}>
              <WarningOutlineIcon />
            </Text>
            <Flex align="center" flex={1} gap={2} paddingY={2}>
              <Text size={1} weight="medium">
                <Translate
                  t={t}
                  i18nKey="banner.confirm-active-scheduled-drafts"
                  values={{count: activeScheduledDrafts.length}}
                />
              </Text>
            </Flex>
            <Flex flex="none">
              <Button text={buttonText} mode="bleed" tone="caution" onClick={handleClick} />
            </Flex>
          </Flex>
        </Card>
      </Box>

      {isDialogOpen && (
        <ConfirmScheduledDraftsDialog
          activeScheduledDrafts={activeScheduledDrafts}
          onClose={handleCloseDialog}
        />
      )}
    </>
  )
}

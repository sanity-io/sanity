import {type ReleaseDocument} from '@sanity/client'
import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Button} from '../../../../ui-components'
import {Translate, useTranslation} from '../../../i18n'
import {isCardinalityOneRelease} from '../../../util/releaseUtils'
import {releasesLocaleNamespace} from '../../i18n'
import {ConfirmScheduledDraftsDialog} from './ConfirmScheduledDraftsDialog'

interface ConfirmActiveScheduledDraftsBannerProps {
  releases: ReleaseDocument[]
}

/**
 * Active drafts are those with state='active' and cardinality='one'
 */
export function ConfirmActiveScheduledDraftsBanner({
  releases,
}: ConfirmActiveScheduledDraftsBannerProps) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const activeScheduledDrafts = useMemo(
    () =>
      releases.filter((release) => release.state === 'active' && isCardinalityOneRelease(release)),
    [releases],
  )

  const handleOpenDialog = useCallback(() => {
    setIsDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false)
  }, [])

  if (activeScheduledDrafts.length === 0) {
    return null
  }

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
              <Button
                text={t('banner.confirm-active-scheduled-drafts.button')}
                mode="bleed"
                tone="caution"
                onClick={handleOpenDialog}
              />
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

import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {useMemo} from 'react'

import {isCardinalityOneRelease, type ReleaseDocument} from '../../..'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'

interface DraftsDisabledBannerProps {
  isDraftModelEnabled: boolean
  isScheduledDraftsEnabled: boolean
  allReleases: ReleaseDocument[]
}

/**
 * Banner that shows when viewing drafts but either drafts mode or scheduled drafts are disabled
 */
export const DraftsDisabledBanner = ({
  isDraftModelEnabled,
  isScheduledDraftsEnabled,
  allReleases,
}: DraftsDisabledBannerProps) => {
  const {t} = useTranslation(releasesLocaleNamespace)
  const hasSingleDocRelease = useMemo(
    () => allReleases.some(isCardinalityOneRelease),
    [allReleases],
  )
  const shouldShowBanner =
    (!isDraftModelEnabled || !isScheduledDraftsEnabled) && hasSingleDocRelease

  if (!shouldShowBanner) return null

  const getBannerMessage = () =>
    isScheduledDraftsEnabled
      ? t('banner.drafts-mode-disabled')
      : t('banner.scheduled-drafts-disabled')

  return (
    <Box padding={1} marginBottom={4}>
      <Card radius={3} paddingX={2} paddingY={2} tone="caution">
        <Flex align="center" gap={3} paddingX={2}>
          <Text size={0}>
            <WarningOutlineIcon />
          </Text>
          <Flex align="center" flex={1} gap={2} paddingY={2}>
            <Text size={1} weight="medium">
              {getBannerMessage()}
            </Text>
          </Flex>
        </Flex>
      </Card>
    </Box>
  )
}

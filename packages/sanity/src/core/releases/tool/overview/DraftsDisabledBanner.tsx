import {type ReleaseDocument} from '@sanity/client'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Card, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {Box, Flex} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {isCardinalityOneRelease} from '../../../util/releaseUtils'
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
        <Flex alignItems="center" gap={3} paddingX={2}>
          <Text size={0}>
            <WarningOutlineIcon />
          </Text>
          <Flex alignItems="center" flexBasis="0%" flexGrow={1} gap={2} paddingY={2}>
            <Text size={1} weight="medium">
              {getBannerMessage()}
            </Text>
          </Flex>
        </Flex>
      </Card>
    </Box>
  )
}

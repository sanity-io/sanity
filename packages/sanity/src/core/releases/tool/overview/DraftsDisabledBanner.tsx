import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Text} from '@sanity/ui'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {releasesLocaleNamespace} from '../../i18n'

interface DraftsDisabledBannerProps {
  isDraftModelEnabled: boolean
  isScheduledDraftsEnabled: boolean
}

/**
 * Banner that shows when viewing drafts but either drafts mode or scheduled drafts are disabled
 */
export const DraftsDisabledBanner = ({
  isDraftModelEnabled,
  isScheduledDraftsEnabled,
}: DraftsDisabledBannerProps) => {
  const {t} = useTranslation(releasesLocaleNamespace)

  const shouldShowBanner = !isDraftModelEnabled || !isScheduledDraftsEnabled

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

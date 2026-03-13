import {CloseIcon, WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Text} from '@sanity/ui'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'

interface ReleaseNotFoundBannerProps {
  onDismiss: () => void
}

export function ReleaseNotFoundBanner({onDismiss}: ReleaseNotFoundBannerProps) {
  const {t} = useTranslation(releasesLocaleNamespace)

  return (
    <Box flex="none" padding={1} marginBottom={4}>
      <Card radius={3} paddingX={2} paddingY={2} tone="caution">
        <Flex align="center" gap={3} paddingX={2}>
          <Text size={0}>
            <WarningOutlineIcon />
          </Text>
          <Box flex={1} paddingY={2}>
            <Text size={1} weight="medium">
              {t('banner.release-not-found')}
            </Text>
          </Box>
          <Button
            icon={CloseIcon}
            mode="bleed"
            onClick={onDismiss}
            tooltipProps={{content: t('banner.release-not-found.dismiss')}}
          />
        </Flex>
      </Card>
    </Box>
  )
}

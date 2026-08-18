import {CloseIcon} from '@sanity/icons/Close'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Card, Flex, Text} from '@sanity/ui'
import {Box} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {releasesLocaleNamespace} from '../../i18n'

interface ReleaseNotFoundBannerProps {
  onDismiss: () => void
}

export function ReleaseNotFoundBanner({onDismiss}: ReleaseNotFoundBannerProps) {
  const {t} = useTranslation(releasesLocaleNamespace)

  return (
    <Box flexBasis="auto" flexGrow={0} flexShrink={0} padding={1} marginBottom={4}>
      <Card radius={3} paddingX={2} paddingY={2} tone="caution">
        <Flex align="center" gap={3} paddingX={2}>
          <Text size={0}>
            <WarningOutlineIcon />
          </Text>
          <Box flexBasis="0%" flexGrow={1} paddingY={2}>
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

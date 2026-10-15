import {CloseIcon} from '@sanity/icons/Close'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Card} from '@sanity/ui'
import {Text, Box, Flex, Icon} from 'ui5'

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
        <Flex alignItems="center" gap={3} paddingX={2}>
          <Icon size={0} style={{margin: '-0.3125rem'}} icon={WarningOutlineIcon} tone="caution" />
          <Box flexBasis="0%" flexGrow={1} paddingY={2}>
            <Text size={1} weight="medium" as="div" trim={true} tone="caution">
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

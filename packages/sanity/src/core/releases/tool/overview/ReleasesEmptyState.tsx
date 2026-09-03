import {Inline, Text} from '@sanity/ui'
import {Flex} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useReleasesUpsell} from '../../contexts/upsell/useReleasesUpsell'
import {releasesLocaleNamespace} from '../../i18n'
import {ReleaseIllustration} from '../resources/ReleaseIllustration'

interface ReleasesEmptyStateProps {
  createReleaseButton?: React.ReactNode
}

export const ReleasesEmptyState = ({createReleaseButton}: ReleasesEmptyStateProps) => {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {mode} = useReleasesUpsell()

  if (mode === 'upsell') {
    return null
  }

  return (
    <Flex
      flexDirection="column"
      flexBasis="0%"
      flexGrow={1}
      justifyContent={'center'}
      alignItems={'center'}
    >
      <Flex gap={3} flexDirection="column" alignItems="center" style={{maxWidth: '300px'}}>
        <ReleaseIllustration />
        <Text as="h1" size={1} weight="semibold" data-testid="no-releases-info-text">
          {t('overview.title')}
        </Text>
        <Text size={1} muted style={{textAlign: 'center'}}>
          {t('overview.description')}
        </Text>
        <Inline gap={2}>
          {createReleaseButton}
          <Button
            as="a"
            href="https://www.sanity.io/docs/content-releases"
            target="_blank"
            mode="ghost"
            text={t('overview.action.documentation')}
          />
        </Inline>
      </Flex>
    </Flex>
  )
}

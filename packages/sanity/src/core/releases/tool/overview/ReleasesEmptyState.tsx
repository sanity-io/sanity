import {Flex, Inline, Text} from '@sanity/ui'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
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
    <Flex direction="column" flex={1} justify={'center'} align={'center'}>
      <Flex gap={3} direction="column" align="center" style={{maxWidth: '300px'}}>
        <ReleaseIllustration />
        <Text as="h1" size={1} weight="semibold" data-testid="no-releases-info-text">
          {t('overview.title')}
        </Text>
        <Text size={1} muted style={{textAlign: 'center'}}>
          {t('overview.description')}
        </Text>
        <Inline space={2}>
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

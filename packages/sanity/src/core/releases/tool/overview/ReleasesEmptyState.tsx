import {Flex, Inline, Text} from '@sanity/ui'
import {useCallback} from 'react'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useReleasesUpsell} from '../../contexts/upsell/useReleasesUpsell'
import {releasesLocaleNamespace} from '../../i18n'
import {ReleaseIllustration} from '../resources/ReleaseIllustration'

interface ReleasesEmptyStateProps {
  createReleaseButton?: React.ReactNode
  onClickCreateRelease: () => void
}

export const ReleasesEmptyState = ({
  createReleaseButton,
  onClickCreateRelease,
}: ReleasesEmptyStateProps) => {
  const {t} = useTranslation(releasesLocaleNamespace)

  const handleDocumentationClick = useCallback(() => {
    onClickCreateRelease()
  }, [onClickCreateRelease])
  const {mode} = useReleasesUpsell()

  return (
    <Flex
      direction="column"
      flex={1}
      paddingTop={mode === 'upsell' ? 4 : 0}
      justify={mode === 'upsell' ? 'flex-start' : 'center'}
      align={'center'}
      style={{position: 'relative'}}
    >
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
            onClick={handleDocumentationClick}
            text={t('overview.action.documentation')}
          />
        </Inline>
      </Flex>
    </Flex>
  )
}

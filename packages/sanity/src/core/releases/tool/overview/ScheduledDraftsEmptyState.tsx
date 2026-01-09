import {Flex, Text} from '@sanity/ui'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n'
import {useSingleDocReleaseEnabled} from '../../../singleDocRelease/context/SingleDocReleaseEnabledProvider'
import {singleDocReleaseNamespace} from '../../../singleDocRelease/i18n'
import {ReleaseIllustration} from '../resources/ReleaseIllustration'

export const ScheduledDraftsEmptyState = () => {
  const {t} = useTranslation(singleDocReleaseNamespace)
  const {mode} = useSingleDocReleaseEnabled()
  if (mode === 'upsell') {
    return null
  }
  return (
    <Flex direction="column" flex={1} justify={'center'} align={'center'}>
      <Flex gap={3} direction="column" align="center" style={{maxWidth: '300px'}}>
        <ReleaseIllustration />
        <Text as="h1" size={1} weight="semibold" data-testid="no-releases-info-text">
          {t('empty-state.title')}
        </Text>
        <Text size={1} muted style={{textAlign: 'center'}}>
          {t('empty-state.description')}
        </Text>

        <Button
          as="a"
          href="https://www.sanity.io/docs/studio/scheduled-drafts-user-guide"
          target="_blank"
          mode="ghost"
          text={t('empty-state.action.documentation')}
        />
      </Flex>
    </Flex>
  )
}

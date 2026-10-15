import {Text, Flex} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useSingleDocReleaseEnabled} from '../../../singleDocRelease/context/SingleDocReleaseEnabledProvider'
import {singleDocReleaseNamespace} from '../../../singleDocRelease/i18n'
import {ReleaseIllustration} from '../resources/ReleaseIllustration'

export const ScheduledDraftsEmptyState = () => {
  // oxlint-disable-next-line @repo/i18n/no-plugin-namespace-outside-plugin -- only rendered in the scheduled drafts view of the releases tool, which getInitialCardinalityView limits to studios with scheduledDrafts.enabled, ie with the singleDocRelease plugin loaded
  const {t} = useTranslation(singleDocReleaseNamespace)
  const {mode} = useSingleDocReleaseEnabled()
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
        <Text as="h1" size={1} weight="semibold" data-testid="no-releases-info-text" trim={true}>
          {t('empty-state.title')}
        </Text>
        <Text size={1} muted align="center" as="div" trim={true}>
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

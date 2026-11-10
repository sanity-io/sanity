import {CloseIcon} from '@sanity/icons/Close'
import {Flex, Text} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {commentsLocaleNamespace} from '../../i18n'

/**
 * What the inspector shows when the feature check failed. Whether the plan has comments is then
 * unknown, so it fails closed, and the panel says so since the inspector can still be opened
 * (menu item, field button, link).
 */
export function CommentsInspectorUnavailable({onClose}: {onClose: () => void}) {
  const {t} = useTranslation(commentsLocaleNamespace)

  return (
    <Flex flexDirection="column" height="100%">
      <Flex alignItems="center" padding={2}>
        <Flex flexBasis="0%" flexGrow={1} padding={3} paddingY={2}>
          <Text as="h1" size={1} weight="medium" trim={true}>
            {t('feature-name')}
          </Text>
        </Flex>
        <Flex flexShrink={0} padding={1}>
          <Button
            aria-label={t('close-pane-button-text-aria-label')}
            icon={CloseIcon}
            mode="bleed"
            onClick={onClose}
            tooltipProps={{content: t('close-pane-button-text')}}
          />
        </Flex>
      </Flex>
      <Flex padding={4}>
        <Text muted size={1}>
          {t('inspector.unavailable.text')}
        </Text>
      </Flex>
    </Flex>
  )
}

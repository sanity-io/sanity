import {FeedbackIcon} from '@sanity/icons'
import {MenuDivider} from '@sanity/ui'

import {MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {feedbackLocaleNamespace} from '../../../../i18n/localeNamespaces'

interface FeedbackMenuItemProps {
  onClick: () => void
}

/**
 * Feedback menu item rendered inside the help menu.
 *
 * @internal
 */
export function FeedbackMenuItem(props: FeedbackMenuItemProps) {
  const {onClick} = props
  const {t} = useTranslation(feedbackLocaleNamespace)

  return (
    <>
      <MenuItem icon={FeedbackIcon} text={t('feedback.menu-item')} onClick={onClick} />
      <MenuDivider />
    </>
  )
}

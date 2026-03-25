import {FeedbackIcon} from '@sanity/icons'
import {MenuDivider} from '@sanity/ui'

import {MenuItem} from '../../../../../ui-components'
import {useFeedbackAvailable} from '../../../../feedback/hooks/useFeedbackAvailable'
import {useTranslation} from '../../../../i18n'

interface FeedbackMenuItemProps {
  dsn: string
  onClick: () => void
}

/**
 * Feedback menu item that checks tunnel availability on mount.
 * Since this renders inside the menu popover, the check only fires
 * when the menu opens.
 *
 * @internal
 */
export function FeedbackMenuItem(props: FeedbackMenuItemProps) {
  const {dsn, onClick} = props
  const {t} = useTranslation()
  const available = useFeedbackAvailable(dsn)

  if (!available) return null

  return (
    <>
      <MenuItem icon={FeedbackIcon} text={t('feedback.menu-item')} onClick={onClick} />
      <MenuDivider />
    </>
  )
}

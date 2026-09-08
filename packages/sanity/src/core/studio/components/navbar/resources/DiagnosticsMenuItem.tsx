import {BugIcon} from '@sanity/icons/Bug'

import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'

interface DiagnosticsMenuItemProps {
  onClick: () => void
}

/** @internal */
export function DiagnosticsMenuItem({onClick}: DiagnosticsMenuItemProps) {
  const {t} = useTranslation()
  return <MenuItem icon={BugIcon} text={t('diagnostics.menu-item')} onClick={onClick} />
}

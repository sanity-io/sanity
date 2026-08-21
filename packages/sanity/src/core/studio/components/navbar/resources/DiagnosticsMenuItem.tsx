/* oxlint-disable @sanity/i18n/no-attribute-string-literals -- Diagnostics uses fixed English terminology so support and users see the same technical labels. */
import {BugIcon} from '@sanity/icons/Bug'

import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'

interface DiagnosticsMenuItemProps {
  onClick: () => void
}

/** @internal */
export function DiagnosticsMenuItem({onClick}: DiagnosticsMenuItemProps) {
  return <MenuItem icon={BugIcon} text="Diagnostics" onClick={onClick} />
}

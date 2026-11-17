import {CloseIcon} from '@sanity/icons/Close'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type CSSProperties} from 'react'
import {Flex} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {releasesLocaleNamespace} from '../../i18n'
import {RELEASE_ATTENTION_WINDOW_DAYS} from '../../util/getReleaseAttention'

// Read by screen readers, not painted. The region stays mounted so a change in the count is
// announced, also when the count drops to zero and the button goes away.
const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
}

/**
 * The "N releases need a decision" filter on the releases overview. Shown when at least one open
 * release needs a decision, or while the filter is on (so it can always be cleared). Pressing it
 * shows only those releases; pressing it again shows all of them.
 *
 * @internal
 */
export function NeedsDecisionFilter({
  count,
  active,
  onToggle,
}: {
  count: number
  active: boolean
  onToggle: () => void
}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const label = t('overview.needs-decision', {count})

  return (
    <Flex alignItems="center">
      <span role="status" style={VISUALLY_HIDDEN}>
        {count > 0 ? label : ''}
      </span>
      {(count > 0 || active) && (
        <Button
          data-testid="needs-decision-filter"
          aria-pressed={active}
          icon={WarningOutlineIcon}
          iconRight={active ? CloseIcon : undefined}
          mode={active ? 'default' : 'ghost'}
          tone="caution"
          selected={active}
          onClick={onToggle}
          text={label}
          tooltipProps={{
            content: active
              ? t('overview.needs-decision-clear')
              : t('overview.needs-decision-tooltip', {days: RELEASE_ATTENTION_WINDOW_DAYS}),
          }}
        />
      )}
    </Flex>
  )
}

import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Text} from '@sanity/ui'

import {ToneIcon} from '../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {type TFunction} from '../../i18n/types'
import {variantsLocaleNamespace} from '../i18n'
import {type ConditionMismatch} from '../util/getVariantConditionMismatches'

/**
 * @internal
 */
export function getConditionMismatchMessage(
  t: TFunction<'variants'>,
  mismatches: readonly ConditionMismatch[],
): string {
  if (mismatches.length !== 1) {
    return t('conditions.mismatch.multiple')
  }

  const mismatch = mismatches[0]
  switch (mismatch.type) {
    case 'unknown-key':
      return t('conditions.mismatch.unknown-key', {key: mismatch.key})
    case 'unknown-value':
      return t('conditions.mismatch.unknown-value', {key: mismatch.key, value: mismatch.value})
    default: {
      const _exhaustive: never = mismatch
      return _exhaustive
    }
  }
}

/**
 * @internal
 */
export function ConditionMismatchIndicator(props: {
  mismatches: readonly ConditionMismatch[]
  testId?: string
}): React.JSX.Element | null {
  const {mismatches, testId = 'variant-condition-mismatch'} = props
  const {t} = useTranslation(variantsLocaleNamespace)

  if (mismatches.length === 0) {
    return null
  }

  const message = getConditionMismatchMessage(t, mismatches)

  return (
    <Tooltip content={message} placement="top" portal>
      <Text
        aria-label={message}
        data-testid={testId}
        role="img"
        size={1}
        // The icon is the only place this message appears, and the tooltip opens on focus.
        tabIndex={0}
      >
        <ToneIcon icon={ErrorOutlineIcon} tone="critical" />
      </Text>
    </Tooltip>
  )
}

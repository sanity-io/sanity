import {TransferIcon} from '@sanity/icons/Transfer'
import {useTranslation} from 'sanity'
import {Icon, Text} from 'ui5'

import {structureLocaleNamespace} from '../../i18n'
import {emptyDiffViewPane} from './EmptyDiffViewPane.css'

/**
 * The next side of the diff view while nothing has been picked to compare with. The picker above
 * it is where the pick happens.
 *
 * @internal
 */
export function EmptyDiffViewPane() {
  const {t} = useTranslation(structureLocaleNamespace)
  return (
    <div className={emptyDiffViewPane} data-testid="diff-view-empty-next">
      <Text muted size={3}>
        <Icon icon={TransferIcon} />
      </Text>
      <Text muted size={1}>
        {t('compare-versions.empty.description')}
      </Text>
    </div>
  )
}

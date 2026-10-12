import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronUpIcon} from '@sanity/icons/ChevronUp'
import {Flex} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {rule} from './ArrayItemsToggle.css'

interface ArrayItemsToggleProps {
  expanded: boolean
  onToggle: () => void
  totalCount: number
}

export function ArrayItemsToggle(props: ArrayItemsToggleProps) {
  const {expanded, onToggle, totalCount} = props
  const {t} = useTranslation()

  return (
    <Flex alignItems="center" gap={2} data-testid="array-items-toggle">
      <div className={rule} />
      <Button
        aria-expanded={expanded}
        iconRight={expanded ? ChevronUpIcon : ChevronDownIcon}
        mode="bleed"
        onClick={onToggle}
        text={
          expanded
            ? t('inputs.array.action.show-fewer-items')
            : t('inputs.array.action.show-all-items', {count: totalCount})
        }
      />
      <div className={rule} />
    </Flex>
  )
}

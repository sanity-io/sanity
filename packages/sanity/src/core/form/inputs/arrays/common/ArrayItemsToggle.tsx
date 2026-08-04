import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronUpIcon} from '@sanity/icons/ChevronUp'
import {Flex} from '@sanity/ui'
import {type CSSProperties} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'

/**
 * Fades out the bottom of a collapsed list, signalling that the array continues past the last
 * rendered item.
 *
 * @internal
 */
export const COLLAPSED_ITEMS_MASK: CSSProperties = {
  maskImage: 'linear-gradient(to bottom, #000 calc(100% - 32px), transparent)',
}

const Rule = styled.div`
  flex: 1;
  height: 1px;
  background-color: var(--card-border-color);
`

interface ArrayItemsToggleProps {
  expanded: boolean
  onToggle: () => void
  totalCount: number
}

export function ArrayItemsToggle(props: ArrayItemsToggleProps) {
  const {expanded, onToggle, totalCount} = props
  const {t} = useTranslation()

  return (
    <Flex align="center" gap={2} data-testid="array-items-toggle">
      <Rule />
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
      <Rule />
    </Flex>
  )
}

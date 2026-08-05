import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronUpIcon} from '@sanity/icons/ChevronUp'
import {Flex, Stack} from '@sanity/ui'
import {type CSSProperties} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'

/**
 * Sits flush beneath the collapsed list so the items appear to continue past the last one
 * rendered. The negative margin absorbs the gap the surrounding stack puts between the list and
 * this toggle.
 */
const Fade = styled.div`
  height: 20px;
  margin-top: -8px;
  pointer-events: none;
  background: linear-gradient(to bottom, var(--card-border-color), transparent);
`

const Rule = styled.div`
  flex: 1;
  height: 1px;
  background: linear-gradient(to var(--rule-direction), transparent, var(--card-border-color));
`

const RULE_TO_LEFT = {'--rule-direction': 'left'} as CSSProperties
const RULE_TO_RIGHT = {'--rule-direction': 'right'} as CSSProperties

interface ArrayItemsToggleProps {
  expanded: boolean
  onToggle: () => void
  totalCount: number
}

export function ArrayItemsToggle(props: ArrayItemsToggleProps) {
  const {expanded, onToggle, totalCount} = props
  const {t} = useTranslation()

  return (
    <Stack data-testid="array-items-toggle">
      {!expanded && <Fade />}
      <Flex align="center" gap={2}>
        <Rule style={RULE_TO_LEFT} />
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
        <Rule style={RULE_TO_RIGHT} />
      </Flex>
    </Stack>
  )
}

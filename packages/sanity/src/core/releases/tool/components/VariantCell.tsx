import {Card} from '@sanity/ui'
import {type CSSProperties, memo} from 'react'
import {Text, Box, Flex, Icon} from 'ui5'

import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {RhombusIcon} from '../../../components/temporary-icons/Rhombus'
import {getVariantConditionsText, getVariantTitle} from '../../../variants/tool/util'
import {type SystemVariant} from '../../../variants/types'

// Purple, matching the perspective bar's variant motif. The perspective bar gets its purple from a
// `tone="suggest"` Card context (which defines --card-icon-color as the suggest purple); the
// --card-badge-* vars only exist inside a Badge, so we replicate the Card approach: a transparent
// suggest-toned wrapper, with the RhombusIcon (stroke=currentColor) picking up --card-icon-color.
const VARIANT_ICON_CARD_STYLE: CSSProperties = {backgroundColor: 'transparent'}

// Which variant a release document targets: ◆ diamond + the variant title, with the full
// conditions ("flags") on hover.
function VariantCell({variant}: {variant: SystemVariant}) {
  const conditions = getVariantConditionsText(variant.conditions)

  return (
    <Tooltip
      portal
      placement="bottom-start"
      disabled={!conditions}
      content={
        conditions ? (
          <Box padding={2}>
            <Text size={1} as="div" trim={true}>
              {conditions}
            </Text>
          </Box>
        ) : undefined
      }
    >
      <Flex alignItems="center" gap={2}>
        <Card tone="suggest" padding={0} style={VARIANT_ICON_CARD_STYLE}>
          <Icon size={2} style={{margin: '-0.4375rem'}} icon={RhombusIcon} tone="suggest" />
        </Card>
        {/* flex + min-width:0 lets the label shrink below its content width so a long variant name
            truncates with an ellipsis instead of overflowing the column. */}
        <Text
          size={1}
          truncate={1}
          weight="medium"
          style={{flex: 1, minWidth: 0}}
          as="div"
          trim={true}
        >
          {getVariantTitle(variant)}
        </Text>
      </Flex>
    </Tooltip>
  )
}

export const MemoVariantCell = memo(VariantCell)

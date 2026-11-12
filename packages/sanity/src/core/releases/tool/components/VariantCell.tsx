import {memo} from 'react'
import {Text, Box, Flex} from 'ui5'

import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {VariantMark} from '../../../../ui-components/variantMark'
import {getVariantConditionsText, getVariantTitle} from '../../../variants/tool/util'
import {type SystemVariant} from '../../../variants/types'

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
        <VariantMark size="inline" />
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

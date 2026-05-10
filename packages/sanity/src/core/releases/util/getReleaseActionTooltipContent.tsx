import {ErrorOutlineIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import {type ReactNode} from 'react'

import {ToneIcon} from '../../../ui-components/toneIcon/ToneIcon'

export function getReleaseActionTooltipContent(
  tooltipText: ReactNode,
  isValidatingDocuments: boolean,
): ReactNode {
  if (!tooltipText) return null

  return (
    <Text muted size={1}>
      <Flex align="center" gap={3} padding={1}>
        <ToneIcon icon={ErrorOutlineIcon} tone={isValidatingDocuments ? 'default' : 'critical'} />
        {tooltipText}
      </Flex>
    </Text>
  )
}

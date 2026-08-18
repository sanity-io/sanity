import {
  type Button, // oxlint-disable-line no-restricted-imports
} from '@sanity/ui'
import {type ComponentProps} from 'react'

import {ChipButton, ChipButtonContainer} from './documentHeader/styles'

/**
 * @internal
 */
export function Chip(props: ComponentProps<typeof Button>) {
  const {ref, ...rest} = props
  return (
    <ChipButtonContainer>
      <ChipButton
        ref={ref}
        paddingY={2}
        paddingLeft={2}
        paddingRight={3}
        gap={2}
        radius="full"
        {...rest}
      />
    </ChipButtonContainer>
  )
}

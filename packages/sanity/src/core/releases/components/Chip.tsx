import {
  type Button, // eslint-disable-line no-restricted-imports
} from '@sanity/ui'
import {type ComponentProps, forwardRef} from 'react'

import {ChipButton, ChipButtonContainer} from './documentHeader/styles'

/**
 * @internal
 */
export const Chip = forwardRef(function Chip(props: ComponentProps<typeof Button>, ref) {
  return (
    <ChipButtonContainer>
      <ChipButton
        ref={ref}
        paddingY={2}
        paddingLeft={2}
        paddingRight={3}
        space={2}
        radius="full"
        {...props}
      />
    </ChipButtonContainer>
  )
})

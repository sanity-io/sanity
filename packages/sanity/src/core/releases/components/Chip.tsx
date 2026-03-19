import {
  Button, // eslint-disable-line no-restricted-imports
} from '@sanity/ui'
import {type ComponentProps, forwardRef} from 'react'

import {chipButton, chipButtonContainer} from './documentHeader/styles.css'

/**
 * @internal
 */
export const Chip = forwardRef(function Chip(props: ComponentProps<typeof Button>, ref) {
  return (
    <span className={chipButtonContainer}>
      <Button className={chipButton}
        ref={ref}
        paddingY={2}
        paddingLeft={2}
        paddingRight={3}
        space={2}
        radius="full"
        {...props}
      />
    </span>
  )
})

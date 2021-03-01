import React, {forwardRef} from 'react'
import Button from 'part:@sanity/components/buttons/default'
import {ButtonProps} from '../buttons/types'

// @todo: give a deprecation warning?
// import styles from 'part:@sanity/components/toggles/button-style'

const ToggleButton = forwardRef((props: Omit<ButtonProps, 'kind'>, ref) => {
  const {children, ...restProps} = props

  return (
    <Button {...restProps} kind="simple" ref={ref as any}>
      {children}
    </Button>
  )
})

ToggleButton.displayName = 'ToggleButton'

export default ToggleButton

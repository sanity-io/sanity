// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

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

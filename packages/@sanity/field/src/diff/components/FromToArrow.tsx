import {Text} from '@sanity/ui'
import React from 'react'
import {ArrowRightIcon} from '@sanity/icons'

export const FromToArrow = (
  props: Omit<React.HTMLProps<HTMLDivElement>, 'children' | 'as' | 'ref'>
) => (
  <Text muted size={1} {...props}>
    <ArrowRightIcon />
  </Text>
)

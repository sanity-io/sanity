import type {PopoverProps} from '@sanity/ui'
import {Popover} from '@sanity/ui'
import React, {forwardRef} from 'react'
import styled from 'styled-components'

const ResultsPopover = styled(Popover)`
  & > div {
    min-height: 43px;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }

  &[data-popper-reference-hidden='true'] {
    display: none;
  }
`

export const SearchPopoverContent = forwardRef(function SearchPopoverContent(
  props: PopoverProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <ResultsPopover
      portal
      placement="bottom"
      arrow={false}
      constrainSize
      radius={2}
      ref={ref}
      scheme="light"
      matchReferenceWidth
      {...props}
    />
  )
})

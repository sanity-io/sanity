import {Popover, PopoverProps} from '@sanity/ui'
import React, {forwardRef} from 'react'
import styled from 'styled-components'
import {useColorScheme} from '../../../colorScheme'

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
  const {scheme} = useColorScheme()

  return (
    <ResultsPopover
      arrow={false}
      constrainSize
      matchReferenceWidth
      placement="bottom"
      portal
      radius={2}
      ref={ref}
      scheme={scheme}
      {...props}
    />
  )
})

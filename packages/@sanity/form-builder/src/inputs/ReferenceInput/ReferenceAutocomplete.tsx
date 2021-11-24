import React, {ComponentProps, ForwardedRef, forwardRef, RefObject, useCallback} from 'react'
import {Autocomplete, Box, Popover, Text} from '@sanity/ui'
import styled from 'styled-components'

const StyledPopover = styled(Popover)`
  width: 100%;
  & > div {
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }
`

export const ReferenceAutocomplete = forwardRef(function ReferenceAutocomplete(
  props: ComponentProps<typeof Autocomplete> & {popoverRef?: RefObject<HTMLDivElement>},
  ref: ForwardedRef<HTMLInputElement>
) {
  const renderPopover = useCallback(
    ({content, hidden, inputElement}) => (
      <StyledPopover
        placement="bottom-start"
        arrow={false}
        constrainSize
        content={content}
        open={!props.loading && !hidden}
        ref={props.popoverRef}
        referenceElement={inputElement}
      />
    ),
    [props.loading, props.popoverRef]
  )
  return (
    <AutocompleteHeightFix>
      <Autocomplete {...props} ref={ref} renderPopover={renderPopover} />
    </AutocompleteHeightFix>
  )
})

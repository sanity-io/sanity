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

const MARGINS: [number, number, number, number] = [-2, 0, 0, 0]

export const ReferenceAutocomplete = forwardRef(function ReferenceAutocomplete(
  props: ComponentProps<typeof Autocomplete> & {popoverRef?: RefObject<HTMLDivElement>},
  ref: ForwardedRef<HTMLInputElement>
) {
  const hasHits = props.options.length > 0
  const renderPopover = useCallback(
    ({content, hidden, inputElement}) => (
      <StyledPopover
        __unstable_margins={MARGINS}
        placement="bottom-start"
        arrow={false}
        constrainSize
        content={content}
        open={hasHits && !props.loading && !hidden}
        ref={props.popoverRef}
        referenceElement={inputElement}
      />
    ),
    [props.loading, hasHits, props.popoverRef]
  )
  return <Autocomplete {...props} ref={ref} renderPopover={renderPopover} />
})

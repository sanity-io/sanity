import React, {ComponentProps, ForwardedRef, forwardRef, MutableRefObject, useCallback} from 'react'
import {Autocomplete, Popover} from '@sanity/ui'
import styled from 'styled-components'

const StyledPopover = styled(Popover)`
  & > div {
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }
`

export const ReferenceAutocomplete = forwardRef(function ReferenceAutocomplete(
  props: ComponentProps<typeof Autocomplete> & {
    referenceElement: HTMLDivElement
    portalRef?: MutableRefObject<HTMLDivElement>
  },
  ref: ForwardedRef<HTMLInputElement>
) {
  const hasHits = props.options.length > 0
  const renderPopover = useCallback(
    (
      {
        content,
        hidden,
        inputElement,
      }: {
        content: React.ReactElement | null
        hidden: boolean
        inputElement: HTMLInputElement | null
      },
      contentRef: React.Ref<HTMLDivElement>
    ) => (
      <StyledPopover
        placement="bottom-start"
        arrow={false}
        constrainSize
        content={<div ref={contentRef}>{content}</div>}
        open={hasHits && !props.loading && !hidden}
        ref={props.portalRef}
        portal
        referenceElement={props.referenceElement || inputElement}
        matchReferenceWidth
      />
    ),
    [props.referenceElement, props.loading, hasHits, props.portalRef]
  )
  return <Autocomplete {...props} ref={ref} renderPopover={renderPopover} />
})

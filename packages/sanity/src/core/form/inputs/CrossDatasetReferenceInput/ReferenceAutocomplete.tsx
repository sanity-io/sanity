import React, {forwardRef, useCallback} from 'react'
import {Autocomplete, Box, Flex, Placement, Popover, Text} from '@sanity/ui'
import styled from 'styled-components'

const StyledPopover = styled(Popover)`
  & > div {
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }
`

const StyledText = styled(Text)`
  word-break: break-word;
`

const FALLBACK_PLACEMENTS: Placement[] = ['top-start', 'bottom-start']

export const ReferenceAutocomplete = forwardRef(function ReferenceAutocomplete(
  props: React.ComponentProps<typeof Autocomplete> & {
    referenceElement: HTMLDivElement | null
    searchString?: string
    portalRef?: React.RefObject<HTMLDivElement>
  },
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const hasResults = props.options && props.options.length > 0
  const renderPopover = useCallback(
    (
      {
        content,
        hidden,
        inputElement,
        onMouseEnter,
        onMouseLeave,
      }: {
        content: React.ReactElement | null
        hidden: boolean
        inputElement: HTMLInputElement | null
        onMouseEnter: () => void
        onMouseLeave: () => void
      },
      contentRef: React.Ref<HTMLDivElement>,
    ) => (
      <StyledPopover
        data-testid="autocomplete-popover"
        placement="bottom-start"
        fallbackPlacements={FALLBACK_PLACEMENTS}
        arrow={false}
        constrainSize
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        content={
          <div ref={contentRef}>
            {hasResults ? (
              content
            ) : (
              <Box padding={4}>
                <Flex align="center" height="fill" justify="center">
                  <StyledText align="center" muted>
                    No results for <strong>“{props.searchString}”</strong>
                  </StyledText>
                </Flex>
              </Box>
            )}
          </div>
        }
        open={!props.loading && !hidden}
        ref={props.portalRef}
        portal
        referenceElement={props.referenceElement || inputElement}
        matchReferenceWidth
      />
    ),
    [hasResults, props.searchString, props.loading, props.portalRef, props.referenceElement],
  )
  return <Autocomplete {...props} ref={ref} renderPopover={renderPopover} />
})

import React, {forwardRef, useCallback} from 'react'
import {Autocomplete, Box, Flex, Popover, Text} from '@sanity/ui'
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

export type ReferenceAutocompleteProps = React.ComponentProps<typeof Autocomplete> & {
  referenceElement: HTMLDivElement | null
  searchString?: string
  portalRef?: React.RefObject<HTMLDivElement>
}

export const ReferenceAutocomplete = forwardRef(function ReferenceAutocomplete(
  props: ReferenceAutocompleteProps,
  ref: React.ForwardedRef<HTMLInputElement>
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
      contentRef: React.Ref<HTMLDivElement>
    ) => (
      <StyledPopover
        placement="bottom-start"
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
                    {props.searchString?.toLowerCase() === 'capybara' ? (
                      <>. What a shame. There should be more Capybaras.</>
                    ) : null}
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
    [hasResults, props.searchString, props.loading, props.portalRef, props.referenceElement]
  )
  return <Autocomplete {...props} ref={ref} renderPopover={renderPopover} />
})

import React, {
  ComponentProps,
  ForwardedRef,
  forwardRef,
  MutableRefObject,
  ReactNode,
  useCallback,
} from 'react'
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

export const ReferenceAutocomplete = forwardRef(function ReferenceAutocomplete(
  props: ComponentProps<typeof Autocomplete> & {
    referenceElement: HTMLDivElement
    searchString?: string
    portalRef?: MutableRefObject<HTMLDivElement>
  },
  ref: ForwardedRef<HTMLInputElement>
) {
  const hasResults = props.options.length > 0
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

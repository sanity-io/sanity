import React, {forwardRef, useCallback} from 'react'
import {Autocomplete, Box, Flex, Placement, Popover, Text} from '@sanity/ui'
import styled from 'styled-components'
import {Translate, useTranslation} from '../../../i18n'

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
  const {t} = useTranslation()
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
                    <Translate
                      t={t}
                      i18nKey="inputs.reference.no-results-for-query"
                      components={{SearchTerm: ({children}) => <strong>{children}</strong>}}
                      values={{searchString: props.searchString || ''}}
                    />
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
    [hasResults, t, props.searchString, props.loading, props.portalRef, props.referenceElement],
  )
  return <Autocomplete {...props} ref={ref} renderPopover={renderPopover} />
})

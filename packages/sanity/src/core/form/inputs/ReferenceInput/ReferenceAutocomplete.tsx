import React, {forwardRef, useCallback} from 'react'
import {Autocomplete, Box, Flex, Placement, Text} from '@sanity/ui'
import styled from 'styled-components'
import {Popover} from '../../../../ui-components'
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
  const {searchString, loading, portalRef, referenceElement, ...restProps} = props
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
                      values={{searchTerm: searchString || ''}}
                    />
                  </StyledText>
                </Flex>
              </Box>
            )}
          </div>
        }
        open={!loading && !hidden}
        ref={portalRef}
        portal
        referenceElement={referenceElement || inputElement}
        matchReferenceWidth
      />
    ),
    [hasResults, t, searchString, loading, portalRef, referenceElement],
  )
  return <Autocomplete {...restProps} loading={loading} ref={ref} renderPopover={renderPopover} />
})

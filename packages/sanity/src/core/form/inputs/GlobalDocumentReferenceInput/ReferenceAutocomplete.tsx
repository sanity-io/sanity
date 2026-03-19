import {Autocomplete, Box, Flex, type Placement, Text} from '@sanity/ui'
import {
  type ComponentProps,
  type ForwardedRef,
  forwardRef,
  type ReactElement,
  type Ref,
  type RefObject,
  useCallback,
} from 'react'

import {Popover} from '../../../../ui-components'
import {Translate, useTranslation} from '../../../i18n'
import {noResultsText, popover} from './ReferenceAutocomplete.css'

const FALLBACK_PLACEMENTS: Placement[] = ['top-start', 'bottom-start']

export const ReferenceAutocomplete = forwardRef(function ReferenceAutocomplete(
  props: ComponentProps<typeof Autocomplete> & {
    referenceElement: HTMLDivElement | null
    searchString?: string
    portalRef?: RefObject<HTMLDivElement | null>
  },
  ref: ForwardedRef<HTMLInputElement>,
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
        content: ReactElement | null
        hidden: boolean
        inputElement: HTMLInputElement | null
        onMouseEnter: () => void
        onMouseLeave: () => void
      },
      contentRef: Ref<HTMLDivElement>,
    ) => (
      <Popover
        data-testid="autocomplete-popover"
        placement="bottom-start"
        fallbackPlacements={FALLBACK_PLACEMENTS}
        arrow={false}
        constrainSize
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        content={
          <div ref={contentRef} className={popover}>
            {hasResults ? (
              content
            ) : (
              <Box padding={4}>
                <Flex align="center" height="fill" justify="center">
                  <Text className={noResultsText} align="center" muted>
                    <Translate
                      t={t}
                      i18nKey="inputs.reference.no-results-for-query"
                      values={{searchTerm: searchString || ''}}
                    />
                  </Text>
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
  return <Autocomplete {...restProps} ref={ref} renderPopover={renderPopover} />
})

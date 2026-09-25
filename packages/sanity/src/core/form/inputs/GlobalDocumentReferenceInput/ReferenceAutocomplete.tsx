import {type Placement, Text} from '@sanity/ui'
import {Autocomplete} from '@sanity/ui/autocomplete'
import {
  type ComponentProps,
  type ReactElement,
  type Ref,
  type RefObject,
  useCallback,
  type RefAttributes,
} from 'react'
import {Flex, Box} from 'ui5'

import {Popover} from '../../../../ui-components/popover/Popover'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {useReferenceAutocompletePopoverBoundary} from '../../hooks/useReferenceAutocompletePopoverBoundary'
import {noResultsText, popover} from './ReferenceAutocomplete.css'

const FALLBACK_PLACEMENTS: Placement[] = ['top-start', 'bottom-start']

export function ReferenceAutocomplete(
  props: ComponentProps<typeof Autocomplete> & {
    referenceElement: HTMLDivElement | null
    searchString?: string
    portalRef?: RefObject<HTMLDivElement | null>
  } & RefAttributes<HTMLInputElement>,
) {
  const {ref, searchString, loading, portalRef, referenceElement, ...restProps} = props
  const {t} = useTranslation()
  const hasResults = props.options && props.options.length > 0
  const popoverBoundary = useReferenceAutocompletePopoverBoundary(referenceElement)
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
        className={popover}
        data-testid="autocomplete-popover"
        placement="bottom-start"
        fallbackPlacements={FALLBACK_PLACEMENTS}
        arrow={false}
        constrainSize
        floatingBoundary={popoverBoundary}
        referenceBoundary={popoverBoundary}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        content={
          <div ref={contentRef}>
            {hasResults ? (
              content
            ) : (
              <Box padding={4}>
                <Flex alignItems="center" height="100%" justifyContent="center">
                  <Text align="center" className={noResultsText} muted>
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
    [hasResults, t, searchString, loading, portalRef, referenceElement, popoverBoundary],
  )
  return <Autocomplete {...restProps} ref={ref} renderPopover={renderPopover} />
}

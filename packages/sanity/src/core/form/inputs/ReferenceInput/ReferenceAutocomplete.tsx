import {type Path} from '@sanity/types'
import {Autocomplete, Box, Flex, type Placement, Text} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {
  type ComponentProps,
  type ForwardedRef,
  forwardRef,
  type Ref,
  type RefObject,
  useCallback,
  useState,
} from 'react'
import {styled} from 'styled-components'

import {useFormBuilder} from '../..'
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

/**
 * @internal
 */
export const ReferenceAutocomplete = forwardRef(function ReferenceAutocomplete(
  props: ComponentProps<typeof Autocomplete> & {
    path: Path
    referenceElement: HTMLDivElement | null
    searchString?: string
    portalRef?: RefObject<HTMLDivElement | null>
  },
  ref: ForwardedRef<HTMLInputElement>,
) {
  const {focusPath} = useFormBuilder()
  const {searchString, loading, portalRef, referenceElement, path, ...restProps} = props

  /**
   * Path here is the path of the reference input, not including the _ref segment, that is why we use the
   * startsWith function to validate the autoFocus condition.
   *
   * If the focusPath is either `[field]` or `[field, _ref]` we want to autoFocus the input.
   */
  const [autoFocus] = useState(() => (PathUtils.startsWith(path, focusPath) ? true : false))

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
        content: React.JSX.Element | null
        hidden: boolean
        inputElement: HTMLInputElement | null
        onMouseEnter: () => void
        onMouseLeave: () => void
      },
      contentRef: Ref<HTMLDivElement>,
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
  return (
    <Autocomplete
      {...restProps}
      loading={loading}
      ref={ref}
      renderPopover={renderPopover}
      autoFocus={autoFocus}
    />
  )
})

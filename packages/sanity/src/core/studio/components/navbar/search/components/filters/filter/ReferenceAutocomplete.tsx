import type {ReferenceValue} from '@sanity/types'
import {Autocomplete, Box, Flex, Popover, Text} from '@sanity/ui'
import React, {forwardRef, ReactElement, useCallback, useId, useMemo, useRef, useState} from 'react'
import styled from 'styled-components'
import {useSchema} from '../../../../../../../hooks'
import type {SearchableType, WeightedHit} from '../../../../../../../search'
import {getPublishedId} from '../../../../../../../util'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {useSearch} from '../../../hooks/useSearch'
import {documentTypesTruncated} from '../../../utils/documentTypesTruncated'
import {SearchResultItem} from '../../searchResults/items/SearchResultItem'

interface SearchHit {
  hit: WeightedHit
  value: string
}

interface PopoverContentProps {
  content: ReactElement | null
  hidden: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}

interface ReferenceAutocompleteProps {
  onSelect?: (reference: ReferenceValue | null) => void
  types: SearchableType[]
  value?: ReferenceValue | null
}

const NO_FILTER = () => true

const StyledText = styled(Text)`
  word-break: break-word;
`

export const ReferenceAutocomplete = forwardRef(function DebugMiniReferenceInput(
  {onSelect, types, value}: ReferenceAutocompleteProps,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const autocompletePopoverReferenceElementRef = useRef<HTMLDivElement | null>(null)

  const schema = useSchema()

  const {
    state: {fullscreen},
  } = useSearchState()

  const autocompleteId = useId()

  const [hits, setHits] = useState<SearchHit[]>([])
  const {handleSearch, searchState} = useSearch({
    allowEmptyQueries: true,
    initialState: {
      hits: [],
      loading: false,
      error: null,
      terms: {
        query: '',
        types,
      },
    },
    onComplete: (weightedHits) => {
      setHits(
        weightedHits.map((weightedHit) => ({
          hit: weightedHit,
          value: weightedHit.hit._id,
        }))
      )
    },
    onError: (error) => {
      setHits([])
    },
    onStart: () => {
      //
    },
    schema,
  })

  const handleQueryChange = useCallback(
    (query: string | null) => {
      handleSearch({
        options: {limit: 100},
        terms: {
          query: query || '',
          types,
        },
      })
    },
    [handleSearch, types]
  )

  const handleAutocompleteOpenButtonClick = useCallback(() => {
    handleQueryChange('')
  }, [handleQueryChange])

  const handleSelect = useCallback(
    (val: string) => {
      const hit = hits.find((h) => h.value === val)?.hit.hit
      if (hit) {
        onSelect?.({
          _ref: getPublishedId(hit._id),
          _type: hit._type,
        })
      }
    },
    [hits, onSelect]
  )

  const renderOption = useCallback((option: any) => {
    const documentType = option.hit.hit._type
    return (
      <SearchResultItem disableIntentLink documentId={option.value} documentType={documentType} />
    )
  }, [])

  const renderPopover = useCallback(
    (props: PopoverContentProps, contentRef: React.ForwardedRef<HTMLDivElement>) => {
      const {content, hidden, onMouseEnter, onMouseLeave} = props

      const hasResults = hits && hits.length > 0

      return (
        <Popover
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
                      No results for <strong>“{searchState.terms.query}”</strong>
                    </StyledText>
                  </Flex>
                </Box>
              )}
            </div>
          }
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          open={!searchState.loading && !hidden}
          matchReferenceWidth
          placement="bottom-start"
          referenceElement={autocompletePopoverReferenceElementRef.current}
        />
      )
    },
    [hits, searchState.loading, searchState.terms.query]
  )

  const placeholderText = useMemo(() => {
    const documentTypes = documentTypesTruncated({types})

    if (documentTypes) {
      return `Search for ${documentTypes}`
    }
    return `Search all documents`
  }, [types])

  return (
    <div ref={autocompletePopoverReferenceElementRef}>
      <Autocomplete
        filterOption={NO_FILTER}
        fontSize={fullscreen ? 2 : 1}
        id={autocompleteId}
        loading={searchState.loading}
        openButton={{onClick: handleAutocompleteOpenButtonClick}}
        options={hits}
        onQueryChange={handleQueryChange}
        onSelect={handleSelect}
        placeholder={placeholderText}
        radius={2}
        ref={ref}
        renderOption={renderOption}
        renderPopover={renderPopover}
        value={value?._ref}
      />
    </div>
  )
})

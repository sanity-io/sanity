import {Autocomplete, Card, Popover, Text} from '@sanity/ui'
import React, {forwardRef, ReactElement, Ref, useCallback, useId, useRef, useState} from 'react'
import {useSchema} from '../../../../../../../hooks'
import {WeightedHit} from '../../../../../../../search'
import {useDocumentPreviewStore} from '../../../../../../../store'
import {useSearch} from '../../../hooks/useSearch'
import SearchResultItemPreview from '../../searchResultItem/SearchResultItemPreview'

interface SearchHit {
  hit: WeightedHit
  value: string
}

interface PopoverContentProps {
  content: ReactElement | null
  hidden: boolean
  inputElement: HTMLInputElement | null
  onMouseEnter: () => void
  onMouseLeave: () => void
}

interface DebugMiniReferenceInputProps {
  onSelect?: (documentId: string) => void
}

const NO_FILTER = () => true

export const DebugMiniReferenceInput = forwardRef(function DebugMiniReferenceInput(
  {onSelect}: DebugMiniReferenceInputProps,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const autocompletePopoverReferenceElementRef = useRef<HTMLDivElement | null>(null)

  const schema = useSchema()
  const documentPreviewStore = useDocumentPreviewStore()

  const autocompleteId = useId()

  const [autocompleteOptions, setAutocompleteOptions] = useState<SearchHit[]>([])
  const {handleSearch, searchState} = useSearch({
    initialState: {
      hits: [],
      loading: false,
      error: null,
      terms: {
        filters: [],
        query: '',
        types: [],
      },
    },
    onComplete: (weightedHits) => {
      setAutocompleteOptions(
        weightedHits.map((weightedHit) => ({
          hit: weightedHit,
          value: weightedHit.hit._id,
        }))
      )
    },
    onError: (error) => {
      setAutocompleteOptions([])
    },
    onStart: () => {
      //
    },
    schema,
  })

  const [searchQuery, setSearchQuery] = useState<string | null>(null)

  const handleQueryChange = useCallback(
    (query: string | null) => {
      setSearchQuery(query)
      if (query) {
        handleSearch({
          options: {limit: 10},
          terms: {
            filters: [],
            query,
            types: [],
          },
        })
      }
    },
    [handleSearch]
  )

  const renderOption = useCallback(
    (option: any) => {
      const schemaType = schema.get(option.hit.hit._type)

      // TODO: use reference preview?

      return (
        <Card padding={2} tone="primary">
          {schemaType ? (
            <SearchResultItemPreview
              documentId={option.value}
              documentPreviewStore={documentPreviewStore}
              schemaType={schemaType}
            />
          ) : (
            <Text>Unable to resolve schema</Text>
          )}
        </Card>
      )
    },
    [documentPreviewStore, schema]
  )

  const renderPopover = useCallback(
    (props: PopoverContentProps, contentRef: React.ForwardedRef<HTMLDivElement>) => {
      const {content, hidden, inputElement, onMouseEnter, onMouseLeave} = props

      return (
        <Popover
          arrow={false}
          constrainSize
          content={<div ref={contentRef}>{content}</div>} //
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          open={!hidden}
          // matchReferenceWidth
          placement="bottom-start"
          referenceElement={inputElement}
          // portal
        />
      )
    },
    []
  )

  return (
    <div ref={autocompletePopoverReferenceElementRef}>
      <Autocomplete
        filterOption={NO_FILTER}
        fontSize={1}
        id={autocompleteId}
        openButton
        options={autocompleteOptions}
        onQueryChange={handleQueryChange}
        onSelect={onSelect}
        placeholder="Type to search"
        ref={ref}
        renderOption={renderOption}
        renderPopover={renderPopover}
        // value={searchQuery}
      />
    </div>
  )
})

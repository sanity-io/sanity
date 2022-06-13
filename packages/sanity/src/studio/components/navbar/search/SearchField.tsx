import React, {useCallback, useMemo, useState} from 'react'
import {Text, Flex, Autocomplete, Box, PortalProvider} from '@sanity/ui'
import {SearchIcon} from '@sanity/icons'
import styled from 'styled-components'
import {useDocumentSearchResults} from '../../../../search'
import {getPublishedId} from '../../../../util'
import {SearchFullscreenContent} from './SearchFullscreenContent'
import {SearchItem} from './SearchItem'
import {SearchPopoverContent} from './SearchPopoverContent'

const StyledText = styled(Text)`
  word-break: break-word;
`

const filterOption = () => true

interface SearchFieldProps {
  fullScreen: boolean
  onSearchItemClick: () => void
  portalElement: HTMLElement | null
  setSearchInputElement: (el: HTMLInputElement | null) => void
  relatedElements?: HTMLElement[]
}

export function SearchField(props: SearchFieldProps) {
  const {fullScreen, onSearchItemClick, portalElement, relatedElements, setSearchInputElement} =
    props
  const [query, setQuery] = useState<string | null>(null)

  const results = useDocumentSearchResults({
    includeDrafts: true,
    query: query || '',
  })

  const handleClickItem = useCallback(() => {
    if (fullScreen && onSearchItemClick) {
      onSearchItemClick()
    }
  }, [fullScreen, onSearchItemClick])

  const renderOption = useCallback(
    (option) => {
      const {data} = option.payload
      const documentId = data.hit._id
      const documentType = data.hit._type

      return (
        <SearchItem
          key={documentId}
          onClick={handleClickItem}
          padding={2}
          documentId={documentId}
          documentType={documentType}
        />
      )
    },
    [handleClickItem]
  )

  const renderPopoverFullscreen = useCallback(
    (popoverProps, ref) => {
      if (!popoverProps.hidden && results.error) {
        return (
          <SearchFullscreenContent tone="critical">
            <Flex
              align="center"
              flex={1}
              height="fill"
              justify="center"
              padding={4}
              sizing="border"
            >
              <StyledText align="center" muted>
                {results?.error?.message || 'Something went wrong while searching'}
              </StyledText>
            </Flex>
          </SearchFullscreenContent>
        )
      }

      if (!popoverProps.hidden && query && !results.loading && results.value.length === 0) {
        return (
          <SearchFullscreenContent>
            <Flex
              align="center"
              flex={1}
              height="fill"
              justify="center"
              padding={4}
              sizing="border"
            >
              <StyledText align="center" muted>
                No results for <strong>‘{query}’</strong>
              </StyledText>
            </Flex>
          </SearchFullscreenContent>
        )
      }

      if (!popoverProps.hidden && results.value.length > 0) {
        return (
          <SearchFullscreenContent hidden={popoverProps.hidden} ref={ref}>
            {popoverProps.content}
          </SearchFullscreenContent>
        )
      }

      return undefined
    },
    [query, results]
  )

  const renderPopover = useCallback(
    (popoverProps, ref) => {
      if (!popoverProps.hidden && results.error) {
        return (
          <SearchPopoverContent
            content={
              <Box padding={4}>
                <Flex align="center" height="fill" justify="center">
                  <StyledText align="center" muted>
                    {results?.error?.message || 'Something went wrong while searching'}
                  </StyledText>
                </Flex>
              </Box>
            }
            open={!popoverProps.hidden}
            ref={ref}
            referenceElement={popoverProps.inputElement}
          />
        )
      }

      if (!popoverProps.hidden && query && !results.loading && results.value.length === 0) {
        return (
          <SearchPopoverContent
            content={
              <Box padding={4}>
                <Flex align="center" height="fill" justify="center">
                  <StyledText align="center" muted>
                    No results for <strong>“{query}”</strong>
                  </StyledText>
                </Flex>
              </Box>
            }
            open={!popoverProps.hidden}
            ref={ref}
            referenceElement={popoverProps.inputElement}
          />
        )
      }

      if (!popoverProps.hidden && results.value.length > 0) {
        return (
          <SearchPopoverContent
            content={popoverProps.content}
            open={!popoverProps.hidden}
            ref={ref}
            referenceElement={popoverProps.inputElement}
          />
        )
      }

      return undefined
    },
    [query, results]
  )

  const autoComplete = useMemo(
    () => (
      <Autocomplete
        filterOption={filterOption}
        icon={SearchIcon}
        id="studio-search"
        key="studio-search"
        listBox={{padding: fullScreen ? 2 : 1}}
        loading={results.loading}
        onQueryChange={setQuery}
        options={results.value.map((hit) => {
          return {
            value: hit.hit._id,
            payload: {
              data: hit,
            },
          }
        })}
        placeholder="Search"
        radius={2}
        ref={setSearchInputElement}
        relatedElements={relatedElements}
        renderOption={renderOption}
        renderPopover={fullScreen ? renderPopoverFullscreen : renderPopover}
      />
    ),
    [
      fullScreen,
      relatedElements,
      renderOption,
      renderPopover,
      renderPopoverFullscreen,
      results.loading,
      results.value,
      setSearchInputElement,
    ]
  )

  return <PortalProvider element={fullScreen ? portalElement : null}>{autoComplete}</PortalProvider>
}

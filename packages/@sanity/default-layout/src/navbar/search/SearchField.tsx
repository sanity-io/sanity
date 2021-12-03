import React, {useCallback, useMemo} from 'react'
import {Text, Flex, Autocomplete, Box, PortalProvider} from '@sanity/ui'
import {SearchIcon} from '@sanity/icons'
import styled from 'styled-components'
import {SearchItem, useSearch, SearchPopoverContent, SearchFullscreenContent} from '.'

interface SearchFieldProps {
  fullScreen: boolean
  inputElement: (el: HTMLInputElement | null) => void
  onSearchItemClick: () => void
  portalElement: HTMLDivElement | null
  relatedElements?: HTMLElement[]
}

const StyledText = styled(Text)`
  word-break: break-word;
`

export function SearchField(props: SearchFieldProps) {
  const {fullScreen, inputElement, onSearchItemClick, portalElement, relatedElements} = props
  const {handleSearch, searchState} = useSearch()
  const {hits, loading, searchString, error} = searchState

  const handleClickItem = useCallback(() => {
    if (fullScreen && onSearchItemClick) {
      onSearchItemClick()
    }
  }, [fullScreen, onSearchItemClick])

  const filterOption = useCallback(() => true, [])

  const renderOption = useCallback(
    (option) => {
      const {data} = option.payload
      return <SearchItem data={data} key={data.hit._id} onClick={handleClickItem} padding={2} />
    },
    [handleClickItem]
  )

  const renderPopoverFullscreen = useCallback(
    (popoverProps, ref) => {
      if (!popoverProps.hidden && error) {
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
                {error.message}
              </StyledText>
            </Flex>
          </SearchFullscreenContent>
        )
      }

      if (!popoverProps.hidden && searchString && !loading && hits.length === 0) {
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
                No results for <strong>‘{searchString}’</strong>
              </StyledText>
            </Flex>
          </SearchFullscreenContent>
        )
      }

      return (
        <SearchFullscreenContent hidden={popoverProps.hidden} ref={ref}>
          {popoverProps.content}
        </SearchFullscreenContent>
      )
    },
    [error, searchString, loading, hits]
  )

  const renderPopover = useCallback(
    (popoverProps, ref) => {
      if (!popoverProps.hidden && error) {
        return (
          <SearchPopoverContent
            open={!popoverProps.hidden}
            referenceElement={popoverProps.inputElement}
            ref={ref}
            content={
              <Box padding={4}>
                <Flex align="center" height="fill" justify="center">
                  <StyledText align="center" muted>
                    {error?.message || 'Something went wrong while searching'}
                  </StyledText>
                </Flex>
              </Box>
            }
          />
        )
      }

      if (!popoverProps.hidden && searchString && !loading && hits.length === 0) {
        return (
          <SearchPopoverContent
            open={!popoverProps.hidden}
            referenceElement={popoverProps.inputElement}
            ref={ref}
            content={
              <Box padding={4}>
                <Flex align="center" height="fill" justify="center">
                  <StyledText align="center" muted>
                    No results for <strong>“{searchString}”</strong>
                  </StyledText>
                </Flex>
              </Box>
            }
          />
        )
      }

      if (!popoverProps.hidden && hits.length > 0) {
        return (
          <SearchPopoverContent
            open={!popoverProps.hidden}
            referenceElement={popoverProps.inputElement}
            ref={ref}
            content={popoverProps.content}
          />
        )
      }

      return undefined
    },
    [error, searchString, loading, hits]
  )

  const autoComplete = useMemo(
    () => (
      <Autocomplete
        filterOption={filterOption}
        icon={SearchIcon}
        id="studio-search"
        key="studio-search"
        listBox={{padding: fullScreen ? 2 : 1}}
        loading={loading}
        onQueryChange={handleSearch}
        options={hits.map((hit) => {
          return {
            value: hit.hit._id,
            payload: {
              data: hit,
            },
          }
        })}
        placeholder="Search"
        radius={2}
        ref={inputElement}
        relatedElements={relatedElements}
        renderOption={renderOption}
        renderPopover={fullScreen ? renderPopoverFullscreen : renderPopover}
      />
    ),
    [
      filterOption,
      fullScreen,
      handleSearch,
      hits,
      inputElement,
      loading,
      relatedElements,
      renderOption,
      renderPopover,
      renderPopoverFullscreen,
    ]
  )

  return <PortalProvider element={fullScreen ? portalElement : null}>{autoComplete}</PortalProvider>
}

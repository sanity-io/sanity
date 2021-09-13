import React, {useCallback, useMemo} from 'react'
import {Text, Flex, Autocomplete, Box, PortalProvider} from '@sanity/ui'
import {SearchIcon} from '@sanity/icons'
import styled from 'styled-components'
import {SearchItem, useSearch, SearchPopoverContent, SearchFullscreenContent} from '.'

const StyledText = styled(Text)`
  word-break: break-word;
`

export function SearchField({
  portalElement,
  fullScreen,
  inputElement,
  onSearchItemClick,
}: {
  portalElement: HTMLDivElement | null
  fullScreen: boolean
  inputElement: (el: HTMLInputElement | null) => void
  onSearchItemClick: () => void
}) {
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
    (props, ref) => {
      if (!props.hidden && error) {
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

      if (!props.hidden && searchString && !loading && hits.length === 0) {
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
        <SearchFullscreenContent hidden={props.hidden} ref={ref}>
          {props.content}
        </SearchFullscreenContent>
      )
    },
    [error, searchString, loading, hits]
  )

  const renderPopover = useCallback(
    (props, ref) => {
      if (!props.hidden && error) {
        return (
          <SearchPopoverContent
            open={!props.hidden}
            referenceElement={props.inputElement}
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

      if (!props.hidden && searchString && !loading && hits.length === 0) {
        return (
          <SearchPopoverContent
            open={!props.hidden}
            referenceElement={props.inputElement}
            ref={ref}
            content={
              <Box padding={4}>
                <Flex align="center" height="fill" justify="center">
                  <StyledText align="center" muted>
                    No results for <strong>‘{searchString}’</strong>
                  </StyledText>
                </Flex>
              </Box>
            }
          />
        )
      }

      if (!props.hidden && hits.length > 0) {
        return (
          <SearchPopoverContent
            open={!props.hidden}
            referenceElement={props.inputElement}
            ref={ref}
            content={props.content}
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
        icon={SearchIcon}
        key="studio-search"
        id="studio-search"
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
        filterOption={filterOption}
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
      renderOption,
      renderPopover,
      renderPopoverFullscreen,
    ]
  )

  if (fullScreen) {
    return <PortalProvider element={portalElement}>{autoComplete}</PortalProvider>
  }

  return <PortalProvider element={null}>{autoComplete}</PortalProvider>
}

import React, {useCallback, useMemo} from 'react'
import {Text, Flex, useGlobalKeyDown, Autocomplete, Popover} from '@sanity/ui'
import {SearchIcon} from '@sanity/icons'
import {SearchItem, useSearch, SearchLoading} from '.'

const Root = ({children}: {children: React.ReactNode}) => (
  <Flex align="center" justify="center" sizing="border" paddingX={3} style={{minHeight: 150}}>
    {children}
  </Flex>
)

export function SearchField() {
  const {handleSearch, handleClearSearch, searchState} = useSearch()
  const {hits, loading, searchString, error} = searchState
  const showPopoverContent = loading || (searchString.length > 0 && hits.length === 0)

  useGlobalKeyDown((e) => {
    if (e.key === 'Escape' && searchString?.length > 0) {
      handleClearSearch()
    }
  })

  const renderOption = useCallback(
    (option) => {
      const {data} = option.payload
      return (
        <SearchItem
          data={data}
          key={data.hit._id}
          onClick={handleClearSearch}
          paddingX={1}
          paddingY={2}
        />
      )
    },
    [handleClearSearch]
  )

  const popoverContent = useMemo(() => {
    if (loading) {
      return (
        <Root>
          <SearchLoading />
        </Root>
      )
    }

    if (error) {
      return (
        <Flex align="center" justify="center">
          <Text align="center">{error?.message}</Text>
        </Flex>
      )
    }

    return (
      <Root>
        <Text align="center" muted>
          Could not find <strong style={{wordBreak: 'break-word'}}>"{searchString}"</strong>
        </Text>
      </Root>
    )
  }, [error, loading, searchString])

  return (
    <Popover
      matchReferenceWidth
      portal
      arrow={false}
      content={popoverContent}
      open={showPopoverContent}
      radius={2}
      scheme="light"
    >
      <Autocomplete
        id="studio-search-autocomplete"
        icon={SearchIcon}
        placeholder="Search"
        popover={{
          scheme: 'light',
          radius: 2,
          shadow: 2,
          constrainSize: true,
          matchReferenceWidth: true,
        }}
        onQueryChange={handleSearch}
        value={searchString}
        options={hits.map((hit) => {
          return {
            value: hit.hit._id,
            payload: {
              data: hit,
            },
          }
        })}
        // eslint-disable-next-line react/jsx-no-bind
        filterOption={() => true}
        renderOption={renderOption}
      />
    </Popover>
  )
}

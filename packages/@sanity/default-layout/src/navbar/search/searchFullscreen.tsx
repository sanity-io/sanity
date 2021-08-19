import React, {useCallback, useEffect, useMemo, useRef} from 'react'
import {
  Box,
  Button,
  Card,
  Flex,
  Stack,
  TextInput,
  Text,
  useGlobalKeyDown,
  Menu,
  Layer,
} from '@sanity/ui'
import {SearchIcon, CloseIcon} from '@sanity/icons'
import styled from 'styled-components'
import {useSearch, SearchItem, SearchLoading} from '.'

interface SearchScreenProps {
  onClose: () => void
}

const Root = styled(Card)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  z-index: inherit;
`

const Inner = styled(Card)`
  height: calc(100% - 52px);
`

export function SearchFullscreen({onClose}: SearchScreenProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const {handleSearch, searchState, handleClearSearch} = useSearch()
  const {hits, loading, searchString, error} = searchState

  const handleClose = useCallback(() => {
    handleClearSearch()
    onClose()
  }, [handleClearSearch, onClose])

  useGlobalKeyDown((e) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  })

  useEffect(() => {
    inputRef?.current?.focus()
  }, [])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleSearch(event.currentTarget.value)
    },
    [handleSearch]
  )

  const content = useMemo(() => {
    if (loading) {
      return (
        <Flex align="center" justify="center" padding={6} sizing="border">
          <SearchLoading />
        </Flex>
      )
    }

    if (hits?.length > 0) {
      return (
        <Card>
          <Stack space={1}>
            <Menu focusFirst>
              {hits?.map((data) => (
                <Box sizing="border" key={data.hit._id}>
                  <SearchItem data={data} onClick={handleClose} variant="menu-item" />
                </Box>
              ))}
            </Menu>
          </Stack>
        </Card>
      )
    }

    if (error) {
      return (
        <Flex align="center" justify="center" padding={6} sizing="border">
          <Text align="center">{error?.message}</Text>
        </Flex>
      )
    }

    if (searchString.length > 0) {
      return (
        <Flex align="center" justify="center" padding={6} sizing="border">
          <Text align="center">
            Could not find <strong style={{wordBreak: 'break-word'}}>"{searchString}"</strong>
          </Text>
        </Flex>
      )
    }

    return null
  }, [error, handleClose, hits, loading, searchString])

  return (
    <Layer zOffset={999999}>
      <Root scheme="light">
        <Card padding={2} borderBottom sizing="border">
          <Flex gap={1}>
            <Box flex={1}>
              <TextInput icon={SearchIcon} radius={3} onChange={handleChange} ref={inputRef} />
            </Box>
            <Button onClick={handleClose} icon={CloseIcon} mode="bleed" />
          </Flex>
        </Card>
        <Inner overflow="auto" tone="transparent" sizing="border">
          {content}
        </Inner>
      </Root>
    </Layer>
  )
}

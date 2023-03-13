import {Flex, Inline, Spinner, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {CurrentUser} from '@sanity/types'
import styled from 'styled-components'
import {CommandList} from '../../../../components'
import {supportsTouch} from '../../../../util'
import {NewDocumentOption, PreviewLayout} from './types'
import {INLINE_PREVIEW_HEIGHT, NewDocumentListOption} from './NewDocumentListOption'

const ContentFlex = styled(Flex)`
  min-height: 100px;
`

const QueryString = styled.strong`
  word-break: break-all;
`

export interface NewDocumentListProps {
  currentUser: CurrentUser | null
  loading: boolean
  onDocumentClick: () => void
  options: NewDocumentOption[]
  preview: PreviewLayout
  searchQuery: string
  textInputElement: HTMLInputElement | null
}

export function NewDocumentList(props: NewDocumentListProps) {
  const {currentUser, loading, onDocumentClick, options, preview, searchQuery, textInputElement} =
    props
  const hasOptions = options.length > 0 && !loading

  const handleDocumentClick = useCallback(() => {
    onDocumentClick()
  }, [onDocumentClick])

  const getItemDisabled = useCallback(
    (index: number) => options[index]?.hasPermission === false,
    [options]
  )

  const renderItem = useCallback(
    (item: NewDocumentOption) => {
      return (
        <NewDocumentListOption
          currentUser={currentUser}
          key={item.id}
          onClick={handleDocumentClick}
          option={item}
          preview={preview}
        />
      )
    },
    [currentUser, handleDocumentClick, preview]
  )

  // Render loading state
  if (loading) {
    return (
      <ContentFlex
        align="center"
        flex={1}
        height="fill"
        justify="center"
        padding={4}
        sizing="border"
      >
        <Inline space={2}>
          <Spinner muted size={1} />

          <Text muted size={1}>
            Loading document types…
          </Text>
        </Inline>
      </ContentFlex>
    )
  }

  // Render no search results state
  if (!hasOptions && searchQuery) {
    return (
      <ContentFlex
        align="center"
        flex={1}
        height="fill"
        justify="center"
        padding={4}
        sizing="border"
      >
        <Text align="center" muted size={1}>
          No document types found for <QueryString>“{searchQuery}”</QueryString>
        </Text>
      </ContentFlex>
    )
  }

  // Render no options state
  if (!hasOptions) {
    return (
      <ContentFlex
        align="center"
        flex={1}
        height="fill"
        justify="center"
        padding={4}
        sizing="border"
      >
        <Text align="center" muted size={1}>
          No document types found
        </Text>
      </ContentFlex>
    )
  }

  return (
    <CommandList
      activeItemDataAttr="data-selected"
      ariaLabel="New document"
      autoFocus={!supportsTouch}
      getItemDisabled={getItemDisabled}
      inputElement={textInputElement}
      itemHeight={INLINE_PREVIEW_HEIGHT}
      items={options}
      overscan={5}
      renderItem={renderItem}
    />
  )
}

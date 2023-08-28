import {Flex, Inline, Spinner, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {CurrentUser} from '@sanity/types'
import styled from 'styled-components'
import {Trans} from 'react-i18next'
import {CommandList} from '../../../../components'
import {supportsTouch} from '../../../../util'
import {useTranslation} from '../../../../i18n'
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
  const {t} = useTranslation()
  const hasOptions = options.length > 0 && !loading

  const handleDocumentClick = useCallback(() => {
    onDocumentClick()
  }, [onDocumentClick])

  const getItemDisabled = useCallback(
    (index: number) => options[index]?.hasPermission === false,
    [options],
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
    [currentUser, handleDocumentClick, preview],
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
            {t('navbar.new-document.loading')}
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
          <Trans
            t={t}
            i18nKey="navbar.new-document.no-results"
            components={[<QueryString key={0}>“{searchQuery}”</QueryString>]}
            values={{searchQuery: searchQuery}}
          />
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
          {t('navbar.new-document.no-documents-found')}
        </Text>
      </ContentFlex>
    )
  }

  return (
    <CommandList
      activeItemDataAttr="data-hovered"
      ariaLabel={t('nav-bar.new-document.new-document')}
      autoFocus={supportsTouch ? undefined : 'input'}
      getItemDisabled={getItemDisabled}
      inputElement={textInputElement}
      itemHeight={INLINE_PREVIEW_HEIGHT}
      items={options}
      overscan={5}
      padding={preview === 'inline' ? 1 : 2}
      paddingBottom={0}
      renderItem={renderItem}
    />
  )
}

import {Flex, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {CurrentUser} from '@sanity/types'
import styled from 'styled-components'
import {CommandList} from '../../../../components'
import {supportsTouch} from '../../../../util'
import {LoadingBlock} from '../../../../components/loadingBlock'
import {Translate, useTranslation} from '../../../../i18n'
import {NewDocumentOption, PreviewLayout} from './types'
import {INLINE_PREVIEW_HEIGHT, NewDocumentListOption} from './NewDocumentListOption'

const ContentFlex = styled(Flex)`
  min-height: 100px;
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
    return <LoadingBlock showText />
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
          <Translate t={t} i18nKey="new-document.no-results" values={{searchQuery}} />
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
          {t('new-document.no-document-types-found')}
        </Text>
      </ContentFlex>
    )
  }

  return (
    <CommandList
      activeItemDataAttr="data-hovered"
      ariaLabel={t('new-document.new-document')}
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

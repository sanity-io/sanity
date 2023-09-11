import {Box, Flex, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import styled from 'styled-components'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {SearchIcon} from '@sanity/icons'
import {MentionOptionUser} from '../../types'
import {CommandList} from '../../../components'
import {MentionsMenuItem} from './MentionsMenuItem'

const EMPTY_ARRAY: MentionOptionUser[] = []

const Root = styled(Stack)({
  maxWidth: '220px', // todo: improve
})

const HeaderBox = styled(Box)({
  borderBottom: '1px solid var(--card-border-color)',
  minHeight: 'max-content',
})

const ITEM_HEIGHT = 41
const LIST_PADDING = 4
const MAX_ITEMS = 7

const FlexWrap = styled(Flex)({
  maxHeight: ITEM_HEIGHT * MAX_ITEMS + LIST_PADDING * 2 + ITEM_HEIGHT / 2,
})

interface MentionsMenuProps {
  loading: boolean
  onSelect: (userId: string) => void
  options: MentionOptionUser[] | null
}

export const MentionsMenu = React.forwardRef(function MentionsMenu(
  props: MentionsMenuProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const {loading, onSelect, options = []} = props
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }, [])

  const renderItem = useCallback(
    (itemProps: MentionOptionUser) => {
      return <MentionsMenuItem user={itemProps} onSelect={onSelect} />
    },
    [onSelect],
  )

  const getItemDisabled = useCallback(
    (index: number) => {
      return !options?.[index]?.canBeMentioned
    },
    [options],
  )

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options || EMPTY_ARRAY

    const filtered = options?.filter((option) => {
      return option?.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    })

    return filtered || EMPTY_ARRAY
  }, [options, searchTerm])

  useEffect(() => {
    const timeout = setTimeout(() => inputElement?.focus(), 0)

    return () => {
      clearTimeout(timeout)
    }
  }, [inputElement])

  if (loading) {
    return (
      <Root>
        <Flex align="center" justify="center" padding={4}>
          <Spinner muted size={1} />
        </Flex>
      </Root>
    )
  }

  return (
    <Flex direction="column" height="fill" ref={ref}>
      <HeaderBox padding={1}>
        <TextInput
          fontSize={1}
          icon={SearchIcon}
          onChange={handleInputChange}
          placeholder="Search for a user"
          radius={2}
          ref={setInputElement}
        />
      </HeaderBox>

      {filteredOptions.length === 0 && (
        <Box padding={5}>
          <Text align="center" size={1} muted>
            No users found
          </Text>
        </Box>
      )}

      {filteredOptions.length > 0 && (
        <FlexWrap direction="column" flex={1} overflow="hidden">
          <CommandList
            activeItemDataAttr="data-hovered"
            ariaLabel="List of users to mention"
            autoFocus="input"
            fixedHeight
            getItemDisabled={getItemDisabled}
            inputElement={inputElement}
            itemHeight={41}
            items={filteredOptions}
            padding={1}
            renderItem={renderItem}
          />
        </FlexWrap>
      )}
    </Flex>
  )
})

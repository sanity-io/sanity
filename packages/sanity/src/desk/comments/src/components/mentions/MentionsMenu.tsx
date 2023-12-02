import {Box, Flex, Stack, Text} from '@sanity/ui'
import styled from 'styled-components'
import React, {useCallback, useImperativeHandle, useMemo, useRef, useState} from 'react'
import {deburr} from 'lodash'
import {LoadingBlock} from '../../../../../ui/loadingBlock'
import {MentionOptionUser} from '../../types'
import {MentionsMenuItem} from './MentionsMenuItem'
import {CommandList, CommandListHandle} from 'sanity'

const EMPTY_ARRAY: MentionOptionUser[] = []

const Root = styled(Stack)({
  maxWidth: '220px', // todo: improve
})

const ITEM_HEIGHT = 41
const LIST_PADDING = 4
const MAX_ITEMS = 7

const FlexWrap = styled(Flex)({
  maxHeight: ITEM_HEIGHT * MAX_ITEMS + LIST_PADDING * 2 + ITEM_HEIGHT / 2,
})

export interface MentionsMenuHandle {
  setSearchTerm: (term: string) => void
}
interface MentionsMenuProps {
  loading: boolean
  inputElement?: HTMLDivElement | null
  onSelect: (userId: string) => void
  options: MentionOptionUser[] | null
}

export const MentionsMenu = React.forwardRef(function MentionsMenu(
  props: MentionsMenuProps,
  ref: React.Ref<MentionsMenuHandle>,
) {
  const {loading, onSelect, options = [], inputElement} = props
  const [searchTerm, setSearchTerm] = useState<string>('')
  const commandListRef = useRef<CommandListHandle>(null)

  useImperativeHandle(
    ref,
    () => {
      return {
        setSearchTerm(term: string) {
          setSearchTerm(term)
        },
      }
    },
    [],
  )

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

    // We deburr the search term and the display names so that when searching
    // for e.g "bjorge" we also get results for "bjørge"
    const deburredSearchTerm = deburr(searchTerm).toLocaleLowerCase()

    const deburredOptions = options?.map((option) => ({
      ...option,
      displayName: deburr(option.displayName || '').toLocaleLowerCase(),
    }))

    const filtered = deburredOptions
      ?.filter((option) => {
        return option?.displayName?.includes(deburredSearchTerm)
      })
      // Sort by whether the displayName starts with the search term to get more relevant results first
      ?.sort((a, b) => {
        const matchA = a.displayName?.startsWith(deburredSearchTerm)
        const matchB = b.displayName?.startsWith(deburredSearchTerm)

        if (matchA && !matchB) return -1
        if (!matchA && matchB) return 1

        return 0
      })

    return filtered || EMPTY_ARRAY
  }, [options, searchTerm])

  if (loading) {
    return (
      <Root>
        <LoadingBlock />
      </Root>
    )
  }

  // In this case the input element is the actual content editable HTMLDivElement from the PTE.
  // Typecast it to an input element to make the CommandList component happy.
  const _inputElement = inputElement ? (inputElement as HTMLInputElement) : undefined

  return (
    <Flex direction="column" height="fill" data-testid="comments-mentions-menu">
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
            fixedHeight
            getItemDisabled={getItemDisabled}
            inputElement={_inputElement}
            itemHeight={41}
            items={filteredOptions}
            padding={1}
            ref={commandListRef}
            renderItem={renderItem}
          />
        </FlexWrap>
      )}
    </Flex>
  )
})

import {SearchIcon} from '@sanity/icons'
import {type Path} from '@sanity/types'
import {Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type ChangeEvent, type KeyboardEvent, useCallback, useMemo, useState} from 'react'
import {css, styled} from 'styled-components'

import {Popover, type PopoverProps} from '../../../../../../ui-components'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {useSearchableList} from '../../hooks'
import {type TreeEditingMenuItem} from '../../types'
import {ITEM_HEIGHT, MAX_DISPLAYED_ITEMS} from './constants'
import {TreeEditingSearchMenu} from './TreeEditingSearchMenu'
import {treeEditingSearch} from './utils'

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['bottom-start']

const RootFlex = styled(Flex)``

const PopoverListFlex = styled(Flex)<{
  $maxDisplayedItems: number
  $itemHeight: number
}>((props) => {
  const {$maxDisplayedItems, $itemHeight} = props

  return css`
    --item-height: ${$itemHeight}px;
    --max-items: ${$maxDisplayedItems};
    --list-padding: 0.5rem;

    position: relative;
    max-height: calc(var(--item-height) * var(--max-items) + var(--list-padding));
    min-height: calc((var(--item-height) * 1));
    width: 100%;
  `
})

const StyledPopover = styled(Popover)(() => {
  return css`
    [data-ui='Popover__wrapper'] {
      min-width: 250px;
      display: flex;
      flex-direction: column;
      border-radius: ${({theme}) => theme.sanity.radius[3]}px;
      position: relative;
      overflow: hidden;
      overflow: clip;
    }
  `
})

const StyledTextInput = styled(TextInput)`
  border-radius: inherit;
`

interface TreeEditingSearchProps {
  items: TreeEditingMenuItem[]
  onPathSelect: (path: Path) => void
}

export function TreeEditingSearch(props: TreeEditingSearchProps): React.JSX.Element {
  const {items, onPathSelect} = props

  const [textInputElement, setTextInputElement] = useState<HTMLInputElement | null>(null)
  const [query, setQuery] = useState<string>('')
  const {t} = useTranslation()

  const hasSearchQuery = query.length > 0

  const searchableList = useSearchableList(items)

  const filteredList = useMemo(
    () => treeEditingSearch(searchableList, query),
    [query, searchableList],
  )

  const resetSearch = useCallback(() => setQuery(''), [])

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
  }, [])

  const handlePathSelect = useCallback(
    (path: Path) => {
      onPathSelect(path)
      resetSearch()
    },
    [onPathSelect, resetSearch],
  )

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        resetSearch()
        textInputElement?.focus()
      }
    },
    [resetSearch, textInputElement],
  )

  const handleSearchBlur = useCallback(() => {
    // Run this in the next frame to avoid clearing the search query
    // when the user clicks on a search result
    requestAnimationFrame(() => {
      resetSearch()
    })
  }, [resetSearch])

  const content = useMemo(() => {
    if (filteredList.length === 0) {
      return (
        <Card>
          <Stack padding={4} sizing="border" space={3}>
            <Text align="center" muted size={1} weight="medium">
              {t('tree-editing-dialog.search.no-results-title')}
            </Text>
          </Stack>
        </Card>
      )
    }

    return (
      <RootFlex direction="column" flex={1} height="fill">
        <Card>
          <PopoverListFlex
            $itemHeight={ITEM_HEIGHT}
            $maxDisplayedItems={MAX_DISPLAYED_ITEMS}
            direction="column"
            overflow="hidden"
          >
            <TreeEditingSearchMenu
              items={filteredList}
              onPathSelect={handlePathSelect}
              textInputElement={textInputElement}
            />
          </PopoverListFlex>
        </Card>
      </RootFlex>
    )
  }, [filteredList, handlePathSelect, textInputElement, t])

  return (
    <StyledPopover
      constrainSize
      content={content}
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      matchReferenceWidth
      open={hasSearchQuery}
      placement="bottom-start"
      portal
    >
      <Card radius={3}>
        <StyledTextInput
          fontSize={1}
          icon={SearchIcon}
          onBlur={handleSearchBlur}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          placeholder={t('tree-editing-dialog.search-placeholder')}
          ref={setTextInputElement}
          value={query}
        />
      </Card>
    </StyledPopover>
  )
}

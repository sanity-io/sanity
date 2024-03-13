import {UserIcon} from '@sanity/icons'
import {Menu, Stack, TextInput, useClickOutside} from '@sanity/ui'
import {deburr} from 'lodash'
import {
  type ChangeEvent,
  cloneElement,
  type KeyboardEvent,
  useCallback,
  useMemo,
  useState,
} from 'react'
import styled from 'styled-components'

import {
  MentionsMenu as CommentsMentionsMenu,
  type MentionsMenuUser,
} from '../../../../../../../structure/comments/src/components/mentions'
import {Popover} from '../../../../../../../ui-components'
import {useMentionUser} from '../../../../context'

const EMPTY_ARRAY: [] = []

const NO_ASSIGNEE_OPTION: MentionsMenuUser = {
  id: '',
  displayName: 'No assignee',
  granted: true,
  type: 'reset',
}

const MenuStack = styled(Stack)`
  width: 320px;
`

interface AssigneeSelectionMenuProps {
  menuButton: React.ReactElement
  onSelect: (userId: string) => void
}

export function AssigneeSelectionMenu(props: AssigneeSelectionMenuProps) {
  const {onSelect, menuButton} = props
  const {mentionOptions} = useMentionUser()

  const [searchTerm, setSearchTerm] = useState<string>('')
  const [open, setOpen] = useState(false)

  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)

  const options = useMemo(
    () => [NO_ASSIGNEE_OPTION].concat(mentionOptions.data || EMPTY_ARRAY),
    [mentionOptions.data],
  )

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options || []

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

    return filtered || []
  }, [options, searchTerm])

  const handleSelect = useCallback(
    (userId: string) => {
      onSelect(userId)
      setOpen(false)
      buttonElement?.focus()
    },
    [buttonElement, onSelect],
  )

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.currentTarget.value)
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const shouldClose =
        event.key === 'Escape' || event.key === 'Tab' || (event.key === 'Tab' && event.shiftKey)

      if (shouldClose) {
        setOpen(false)
        buttonElement?.focus()
      }
    },
    [buttonElement],
  )

  const button = useMemo(() => {
    return cloneElement(menuButton, {
      ref: setButtonElement,
      onClick: () => setOpen((v) => !v),
    })
  }, [menuButton])

  useClickOutside(() => setOpen(false), [popoverElement, buttonElement])

  return (
    <Popover
      open={open}
      placement="bottom"
      portal
      ref={setPopoverElement}
      onKeyDown={handleKeyDown}
      content={
        <Menu>
          <MenuStack space={1}>
            <TextInput
              autoFocus
              border={false}
              fontSize={1}
              icon={UserIcon}
              onChange={handleSearchChange}
              placeholder="Search user name"
              ref={setInputElement}
              value={searchTerm}
            />

            <CommentsMentionsMenu
              inputElement={inputElement}
              loading={mentionOptions.loading}
              onSelect={handleSelect}
              options={filteredOptions}
            />
          </MenuStack>
        </Menu>
      }
    >
      {button}
    </Popover>
  )
}

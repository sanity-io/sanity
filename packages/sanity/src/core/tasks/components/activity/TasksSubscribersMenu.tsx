import {UserIcon} from '@sanity/icons'
import {
  Box,
  Checkbox,
  Container,
  Flex,
  Menu,
  MenuDivider,
  // eslint-disable-next-line no-restricted-imports
  MenuItem,
  Text,
  TextInput,
} from '@sanity/ui'
import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import {LoadingBlock, type UserWithPermission, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {MenuButton} from '../../../../../ui-components'
import {tasksLocaleNamespace} from '../../../../i18n'
import {useMentionUser} from '../../context'
import {useFilteredOptions} from '../form/fields/assignee/useFilteredOptions'
import {TasksUserAvatar} from '../TasksUserAvatar'

type SelectItemHandler = (id: string) => void

function MentionUserMenuItem(props: {
  user: UserWithPermission
  onSelect: SelectItemHandler
  selected: boolean
}) {
  const {user, onSelect, selected} = props
  const handleSelect = useCallback(() => onSelect(user.id), [user, onSelect])

  const handleCheckboxClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      handleSelect()
    },
    [handleSelect],
  )

  return (
    <MenuItem onClick={handleSelect} padding={1}>
      <Flex align="center" gap={3}>
        <Flex align="center" gap={2} flex={1}>
          <TasksUserAvatar user={user.id ? user : undefined} size={1} />
          <Text size={1} textOverflow="ellipsis" title={user.displayName}>
            {user.displayName}
          </Text>
        </Flex>
        <Box paddingX={2}>
          <Checkbox onClick={handleCheckboxClick} checked={selected} />
        </Box>
      </Flex>
    </MenuItem>
  )
}

const StyledMenu = styled(Menu)`
  width: 308px;
  border-radius: 3px;
`

const IGNORED_KEYS = [
  'Control',
  'Shift',
  'Alt',
  'Enter',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Meta',
  'Tab',
  'CapsLock',
]

function TasksSubscribers({onSelect, value = []}: {onSelect: SelectItemHandler; value?: string[]}) {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const {mentionOptions} = useMentionUser()
  const inputRef = useRef<HTMLInputElement | null>(null)
  // This list will keep a local state of users who are initially subscribed and later added or removed.
  // To always render them at the top
  const [subscribersList, setSubscribersList] = useState(value)

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.currentTarget.value)
  }, [])

  const filteredOptions = useFilteredOptions({options: mentionOptions.data || [], searchTerm})

  const selectedUsers = useMemo(
    () => filteredOptions.filter((user) => subscribersList.includes(user.id)),
    [filteredOptions, subscribersList],
  )

  const handleSelect = useCallback(
    (id: string) => {
      if (!subscribersList.includes(id)) {
        setSubscribersList([...subscribersList, id])
      }
      onSelect(id)
    },
    [subscribersList, onSelect],
  )
  const renderItem = useCallback(
    (user: UserWithPermission) => {
      return (
        <MentionUserMenuItem
          user={user}
          onSelect={handleSelect}
          key={user.id}
          selected={value.includes(user.id)}
        />
      )
    },
    [handleSelect, value],
  )
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    // If target is input don't do anything
    if (event.target === inputRef.current) {
      return
    }

    if (!IGNORED_KEYS.includes(event.key)) {
      inputRef.current?.focus()
    }
  }, [])

  const {t} = useTranslation(tasksLocaleNamespace)

  if (mentionOptions.loading) {
    return (
      <Container width={0}>
        <LoadingBlock showText />
      </Container>
    )
  }

  return (
    <div onKeyDown={handleKeyDown} style={{maxHeight: '360px', width: '100%'}}>
      <Box paddingBottom={2}>
        <TextInput
          placeholder={t('form.subscribers.menu.input.placeholder')}
          autoFocus
          border={false}
          onChange={handleSearchChange}
          value={searchTerm}
          fontSize={1}
          icon={UserIcon}
          ref={inputRef}
        />
      </Box>

      {filteredOptions.length === 0 ? (
        <Box padding={3}>
          <Text align="center" size={1} muted>
            {t('form.input.assignee.search.no-users.text')}
          </Text>
        </Box>
      ) : (
        <>
          {!searchTerm && selectedUsers.length > 0 && (
            <>
              {selectedUsers.map(renderItem)}
              <Box paddingY={2}>
                <MenuDivider />
              </Box>
            </>
          )}
          {filteredOptions.map(renderItem)}
        </>
      )}
    </div>
  )
}

export function TasksSubscribersMenu(props: {
  onSelect: (userId: string) => void
  menuButton: React.ReactElement
  value?: string[]
}) {
  const {onSelect, menuButton, value} = props

  return (
    <MenuButton
      button={menuButton}
      id="assign-user-menu"
      menu={
        <StyledMenu>
          <TasksSubscribers onSelect={onSelect} value={value} />
        </StyledMenu>
      }
      popover={{
        placement: 'bottom',
        fallbackPlacements: ['bottom'],
        portal: true,
        constrainSize: true,
      }}
    />
  )
}

import {UserIcon} from '@sanity/icons'
import {
  Badge,
  Box,
  Container,
  Flex,
  Menu,
  // eslint-disable-next-line no-restricted-imports
  MenuItem,
  Text,
  TextInput,
} from '@sanity/ui'
import {motion} from 'framer-motion'
import {deburr} from 'lodash'
import {type ChangeEvent, type KeyboardEvent, useCallback, useMemo, useRef, useState} from 'react'
import {LoadingBlock, type UserWithPermission} from 'sanity'
import styled from 'styled-components'

import {MenuButton} from '../../../../../../ui-components'
import {useMentionUser} from '../../../context'
import {TasksUserAvatar} from '../../TasksUserAvatar'

type SelectItemHandler = (id: string) => void

function MentionUserMenuItem(props: {user: UserWithPermission; onSelect: SelectItemHandler}) {
  const {user, onSelect} = props
  const handleSelect = useCallback(() => onSelect(user.id), [user, onSelect])
  return (
    <MenuItem onClick={handleSelect} padding={1} disabled={!user.granted}>
      <Flex align="center" gap={3}>
        <Flex align="center" gap={2} flex={1}>
          <TasksUserAvatar user={user.id ? user : undefined} size={1} />
          <Text size={1} textOverflow="ellipsis" title={user.displayName}>
            {user.displayName}
          </Text>
        </Flex>

        {!user.granted && (
          <Badge fontSize={1} mode="outline">
            Unauthorized
          </Badge>
        )}
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

const NO_ASSIGNEE_OPTION: UserWithPermission = {
  id: '',
  displayName: 'No assignee',
  granted: true,
}
function MentionsMenu({onSelect}: {onSelect: SelectItemHandler}) {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const {mentionOptions} = useMentionUser()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const options = [NO_ASSIGNEE_OPTION].concat(mentionOptions.data || [])
  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.currentTarget.value)
  }, [])

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

  const renderItem = useCallback(
    (user: UserWithPermission) => {
      return <MentionUserMenuItem user={user} onSelect={onSelect} key={user.id} />
    },
    [onSelect],
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

  if (mentionOptions.loading) {
    return (
      <Container width={0}>
        <LoadingBlock showText />
      </Container>
    )
  }

  return (
    <div onKeyDown={handleKeyDown}>
      <TextInput
        placeholder="Search username"
        autoFocus
        border={false}
        onChange={handleSearchChange}
        value={searchTerm}
        fontSize={1}
        icon={UserIcon}
        ref={inputRef}
      />

      <div style={{maxHeight: '320px', overflowY: 'scroll', paddingTop: '8px'}}>
        {filteredOptions.length === 0 ? (
          <Box padding={3}>
            <Text align="center" size={1} muted>
              No users found
            </Text>
          </Box>
        ) : (
          filteredOptions.map(renderItem)
        )}
      </div>
    </div>
  )
}

export function AssigneeSelectionMenu(props: {
  onSelect: (userId: string) => void
  menuButton: React.ReactElement
}) {
  const {onSelect, menuButton} = props

  const ref = useRef<HTMLDivElement | null>(null)

  return (
    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} ref={ref}>
      <MenuButton
        button={menuButton}
        id="assign-user-menu"
        menu={
          <StyledMenu>
            <MentionsMenu onSelect={onSelect} />
          </StyledMenu>
        }
        popover={{
          placement: 'bottom',
          portal: true,
        }}
      />
    </motion.div>
  )
}

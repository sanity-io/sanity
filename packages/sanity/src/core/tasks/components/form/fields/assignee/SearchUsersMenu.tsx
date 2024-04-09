import {UserIcon} from '@sanity/icons'
import {Box, Container, MenuDivider, Text, TextInput} from '@sanity/ui'
import {deburr} from 'lodash'
import {type ChangeEvent, type KeyboardEvent, useCallback, useMemo, useRef, useState} from 'react'
import {LoadingBlock, type UserWithPermission, useTranslation} from 'sanity'

import {tasksLocaleNamespace} from '../../../../i18n'

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

export function SearchUsersMenu({
  renderItem,
  selectedUsers = [],
  loading,
  options,
  name,
  placeholder,
}: {
  renderItem: (user: UserWithPermission) => React.ReactElement
  selectedUsers?: UserWithPermission[]
  loading: boolean
  options: UserWithPermission[]
  name: string
  placeholder: string
}) {
  const {t} = useTranslation(tasksLocaleNamespace)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.currentTarget.value)
  }, [])

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options || []
    const deburredSearchTerm = deburr(searchTerm).toLocaleLowerCase()

    const deburredOptions = options?.map((option) => ({
      ...option,
      searchName: deburr(option.displayName || '').toLocaleLowerCase(),
    }))

    const filtered = deburredOptions
      ?.filter((option) => {
        return option?.searchName.includes(deburredSearchTerm)
      })
      // Sort by whether the displayName starts with the search term to get more relevant results first
      ?.sort((a, b) => {
        const matchA = a.searchName.startsWith(deburredSearchTerm)
        const matchB = b.searchName.startsWith(deburredSearchTerm)

        if (matchA && !matchB) return -1
        if (!matchA && matchB) return 1

        return 0
      })

    return filtered || []
  }, [options, searchTerm])

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    // If target is input don't do anything
    if (event.target === inputRef.current) {
      return
    }

    if (!IGNORED_KEYS.includes(event.key)) {
      inputRef.current?.focus()
    }
  }, [])

  if (loading) {
    return (
      <Container width={0}>
        <LoadingBlock showText />
      </Container>
    )
  }

  return (
    <div onKeyDown={handleKeyDown}>
      <TextInput
        name={name}
        placeholder={placeholder}
        autoFocus
        border={false}
        onChange={handleSearchChange}
        value={searchTerm}
        fontSize={1}
        icon={UserIcon}
        ref={inputRef}
        autoComplete="off"
      />

      <div style={{maxHeight: '320px', overflowY: 'scroll', paddingTop: '8px', width: '100%'}}>
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
    </div>
  )
}

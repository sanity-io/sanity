import {
  AvatarStack,
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button as UIButton,
  Checkbox,
  Flex,
  Menu,
  // eslint-disable-next-line no-restricted-imports
  MenuItem,
  Text,
} from '@sanity/ui'
import {AnimatePresence, motion} from 'framer-motion'
import {type MouseEvent, useCallback, useMemo, useState} from 'react'
import {type UserWithPermission, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {MenuButton} from '../../../../ui-components'
import {useMentionUser} from '../../context'
import {tasksLocaleNamespace} from '../../i18n'
import {SearchUsersMenu} from '../form/fields/assignee/SearchUsersMenu'
import {TasksUserAvatar} from '../TasksUserAvatar'

type SelectItemHandler = (id: string) => void

function SubscriberUserMenuItem(props: {
  user: UserWithPermission
  onSelect: SelectItemHandler
  selected: boolean
}) {
  const {user, onSelect, selected} = props
  const handleSelect = useCallback(() => onSelect(user.id), [user, onSelect])

  const handleCheckboxClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      // Stops propagation to avoid closing the menu. When clicking the checkbox we want to keep the menu open.
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
interface TasksSubscriberMenuProps {
  value?: string[]
  handleUserSubscriptionChange: (userId: string) => void
}

export function TasksSubscribersMenu(props: TasksSubscriberMenuProps) {
  const {value = [], handleUserSubscriptionChange} = props

  const onSelect = useCallback(
    (userId: string) => handleUserSubscriptionChange(userId),
    [handleUserSubscriptionChange],
  )

  const {t} = useTranslation(tasksLocaleNamespace)
  const {mentionOptions} = useMentionUser()
  // This list will keep a local state of users who are initially subscribed and later added or removed.
  // rendering them always at the top.
  const [subscribersList, setSubscribersList] = useState(value)

  const handleSelect = useCallback(
    (id: string) => {
      if (!subscribersList.includes(id)) {
        // Persist user id in local subscribers list state.
        setSubscribersList([...subscribersList, id])
      }
      onSelect(id)
    },
    [subscribersList, onSelect],
  )

  const renderItem = useCallback(
    (user: UserWithPermission) => {
      return (
        <SubscriberUserMenuItem
          user={user}
          onSelect={handleSelect}
          key={user.id}
          selected={value.includes(user.id)}
        />
      )
    },
    [handleSelect, value],
  )

  const selectedUsers = useMemo(
    () => mentionOptions.data?.filter((user) => subscribersList.includes(user.id)),
    [mentionOptions, subscribersList],
  )

  return (
    <MenuButton
      button={
        <UIButton type="button" mode="bleed" padding={1}>
          {value.length > 0 ? (
            <AnimatePresence initial={false}>
              <AvatarStack maxLength={3} size={0}>
                {value.map((subscriberId) => (
                  <motion.div
                    key={subscriberId}
                    exit={{opacity: 0, translateX: '2px', scale: 0.9}}
                    animate={{
                      opacity: 1,
                      translateX: 0,
                      scale: 1,
                      transition: {type: 'just', duration: 0.2},
                    }}
                    initial={{opacity: 0, translateX: '2px', scale: 0.9}}
                  >
                    <TasksUserAvatar user={{id: subscriberId}} size={0} />
                  </motion.div>
                ))}
              </AvatarStack>
            </AnimatePresence>
          ) : (
            <TasksUserAvatar size={0} />
          )}
        </UIButton>
      }
      id="assign-user-menu"
      menu={
        <StyledMenu>
          <SearchUsersMenu
            renderItem={renderItem}
            selectedUsers={selectedUsers}
            loading={mentionOptions.loading}
            options={mentionOptions.data || []}
            name="subscribersSearch"
            placeholder={t('form.subscribers.menu.input.placeholder')}
          />
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

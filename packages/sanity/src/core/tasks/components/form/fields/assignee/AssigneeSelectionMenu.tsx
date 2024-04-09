import {
  Badge,
  Flex,
  Menu,
  // eslint-disable-next-line no-restricted-imports
  MenuItem,
  Text,
} from '@sanity/ui'
import {useCallback} from 'react'
import {styled} from 'styled-components'

import {MenuButton} from '../../../../../../ui-components'
import {type UserWithPermission} from '../../../../../hooks'
import {useTranslation} from '../../../../../i18n'
import {useMentionUser} from '../../../../context'
import {tasksLocaleNamespace} from '../../../../i18n'
import {TasksUserAvatar} from '../../../TasksUserAvatar'
import {SearchUsersMenu} from './SearchUsersMenu'

type SelectItemHandler = (id: string) => void

const StyledMenu = styled(Menu)`
  width: 308px;
  border-radius: 3px;
`

function MentionUserMenuItem(props: {
  user: UserWithPermission
  onSelect: SelectItemHandler
  pressed: boolean
}) {
  const {user, onSelect, pressed} = props
  const {t} = useTranslation(tasksLocaleNamespace)
  const handleSelect = useCallback(() => onSelect(user.id), [user, onSelect])
  return (
    <MenuItem onClick={handleSelect} padding={1} disabled={!user.granted} pressed={pressed}>
      <Flex align="center" gap={3}>
        <Flex align="center" gap={2} flex={1}>
          <TasksUserAvatar user={user.id ? user : undefined} size={1} />
          <Text size={1} textOverflow="ellipsis" title={user.displayName}>
            {user.displayName}
          </Text>
        </Flex>

        {!user.granted && (
          <Badge fontSize={1} mode="outline">
            {t('form.input.assignee.unauthorized.text')}
          </Badge>
        )}
      </Flex>
    </MenuItem>
  )
}

const NO_ASSIGNEE_OPTION: UserWithPermission = {
  id: '',
  displayName: 'No assignee',
  granted: true,
}

export function AssigneeSelectionMenu(props: {
  onSelect: (userId: string) => void
  menuButton: React.ReactElement
  value?: string
}) {
  const {t} = useTranslation(tasksLocaleNamespace)
  const {onSelect, menuButton, value} = props

  const renderItem = useCallback(
    (user: UserWithPermission) => {
      return (
        <MentionUserMenuItem
          user={user}
          onSelect={onSelect}
          key={user.id}
          pressed={user.id === value}
        />
      )
    },
    [onSelect, value],
  )
  const {mentionOptions} = useMentionUser()
  const options = [NO_ASSIGNEE_OPTION].concat(mentionOptions.data || [])

  return (
    <MenuButton
      button={menuButton}
      id="assign-user-menu"
      menu={
        <StyledMenu>
          <SearchUsersMenu
            renderItem={renderItem}
            options={options}
            loading={mentionOptions.loading}
            placeholder={t('form.input.assignee.search.placeholder')}
            name="assigneeSearch"
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

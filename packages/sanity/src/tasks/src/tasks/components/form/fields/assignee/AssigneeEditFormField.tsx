import {
  Badge,
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button,
  Flex,
  Text,
  TextSkeleton,
} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {type FormPatch, type PatchEvent, type Path, set, useFormValue} from 'sanity'
import styled from 'styled-components'

import {useMentionUser} from '../../../../context'
import {TasksUserAvatar} from '../../../TasksUserAvatar'
import {AssigneeSelectionMenu} from './AssigneeSelectionMenu'

const StyledButton = styled(Button)`
  padding: 3px 6px;
`

export function AssigneeEditFormField(props: {
  value: string | undefined
  path: Path
  onChange: (patch: FormPatch | PatchEvent | FormPatch[]) => void
}) {
  const {value, onChange, path} = props
  const subscribers = useFormValue(['subscribers']) as string[] | undefined
  const {mentionOptions} = useMentionUser()
  const mentionedUser = useMemo(
    () => mentionOptions.data?.find((u) => u.id === value),
    [mentionOptions.data, value],
  )

  const onSelect = useCallback(
    (userId: string) => {
      onChange(set(userId, path))
      if (subscribers && !subscribers.includes(userId)) {
        onChange(set([...subscribers, userId], ['subscribers']))
      }
    },
    [onChange, path, subscribers],
  )

  const displayText = useMemo(() => {
    if (value) {
      if (mentionOptions.loading) return <TextSkeleton animated style={{width: '10ch'}} />
      if (mentionedUser) return mentionedUser.displayName || mentionedUser.email
      if (!mentionedUser) return 'User not found'
    }
    return 'Not assigned'
  }, [mentionOptions.loading, mentionedUser, value])

  return (
    <AssigneeSelectionMenu
      onSelect={onSelect}
      value={value}
      menuButton={
        <StyledButton mode="ghost" padding={0}>
          <Flex align="center" gap={3}>
            <Flex align="center" gap={2} flex={1}>
              <TasksUserAvatar user={mentionedUser} size={0} />
              <Box>
                <Text size={1} textOverflow="ellipsis">
                  {displayText}
                </Text>
              </Box>
            </Flex>

            {value && mentionedUser && !mentionedUser.granted && (
              <Badge fontSize={1} mode="outline">
                Unauthorized
              </Badge>
            )}
          </Flex>
        </StyledButton>
      }
    />
  )
}

import {type Path} from '@sanity/types'
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
import {styled} from 'styled-components'

import {Tooltip} from '../../../../../../ui-components/tooltip/Tooltip'
import type {FormPatch} from '../../../../../form/patch/types'
import type {PatchEvent} from '../../../../../form/patch/PatchEvent'
import {set} from '../../../../../form/patch/patch'
import {useFormValue} from '../../../../../form/contexts/FormValue'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {useMentionUser} from '../../../../context/mentionUser/useMentionUser'
import {tasksLocaleNamespace} from '../../../../i18n'
import {TasksUserAvatar} from '../../../TasksUserAvatar'
import {AssigneeSelectionMenu} from './AssigneeSelectionMenu'

const StyledButton = styled(Button)`
  padding: 3px 6px;
`

interface AssigneeEditFormFieldProps {
  value: string | undefined
  path: Path
  onChange: (patch: FormPatch | PatchEvent | FormPatch[]) => void
}

export function AssigneeEditFormField(props: AssigneeEditFormFieldProps) {
  const {value, onChange, path} = props
  const subscribers = useFormValue(['subscribers']) as string[] | undefined
  const {mentionOptions} = useMentionUser()
  const mentionedUser = useMemo(
    () => mentionOptions.data?.find((u) => u.id === value),
    [mentionOptions.data, value],
  )
  const {t} = useTranslation(tasksLocaleNamespace)

  const onSelect = useCallback(
    (userId: string) => {
      onChange(set(userId, path))
      if (subscribers && !subscribers.includes(userId) && userId) {
        onChange(set([...subscribers, userId], ['subscribers']))
      }
    },
    [onChange, path, subscribers],
  )

  const displayText = useMemo(() => {
    if (value) {
      if (mentionOptions.loading) return <TextSkeleton animated style={{width: '10ch'}} />
      if (mentionedUser) return mentionedUser.displayName || mentionedUser.email
      if (!mentionedUser) return t('form.input.assignee.user-not-found.text')
    }
    return t('form.input.assignee.no-user-assigned.text')
  }, [mentionOptions.loading, mentionedUser, value, t])

  return (
    <AssigneeSelectionMenu
      onSelect={onSelect}
      value={value}
      menuButton={
        <StyledButton mode="ghost" padding={0}>
          <Tooltip
            content={
              value
                ? t('form.input.assignee.user-assigned.tooltip')
                : t('form.input.assignee.no-user-assigned.tooltip')
            }
          >
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
                  {t('form.input.assignee.unauthorized.text')}
                </Badge>
              )}
            </Flex>
          </Tooltip>
        </StyledButton>
      }
    />
  )
}

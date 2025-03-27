import {Badge, Card, Flex, Text, TextSkeleton} from '@sanity/ui'
import {getVarName, vars} from '@sanity/ui/css'
import {useCallback, useMemo} from 'react'
import {styled} from 'styled-components'

import {set, type StringInputProps} from '../../../../../form'
import {useTranslation} from '../../../../../i18n'
import {useMentionUser} from '../../../../context'
import {tasksLocaleNamespace} from '../../../../i18n'
import {TasksUserAvatar} from '../../../TasksUserAvatar'
import {AssigneeSelectionMenu} from './AssigneeSelectionMenu'

const FocusableCard = styled(Card)`
  &[data-as='button'] {
    border: 1px solid ${vars.color.border};
    &:focus-within {
      border: 1px solid ${vars.color.focusRing};
    }
    ${getVarName(vars.color.muted.fg)}: ${vars.color.tinted.default.border[4]};
  }
`

export function AssigneeCreateFormField(props: StringInputProps) {
  const {value, onChange} = props
  const {mentionOptions} = useMentionUser()
  const mentionedUser = useMemo(
    () => mentionOptions.data?.find((u) => u.id === value),
    [mentionOptions.data, value],
  )

  const onSelect = useCallback((userId: string) => onChange(set(userId)), [onChange])
  const {t} = useTranslation(tasksLocaleNamespace)
  const displayText = useMemo(() => {
    if (value) {
      if (mentionOptions.loading) return <TextSkeleton animated style={{width: '10ch'}} />
      if (mentionedUser) return mentionedUser.displayName || mentionedUser.email
      if (!mentionedUser) return t('form.input.assignee.user-not-found.text')
    }
    return t('form.input.assignee.search.placeholder')
  }, [mentionOptions.loading, mentionedUser, value, t])

  return (
    <AssigneeSelectionMenu
      onSelect={onSelect}
      value={value}
      menuButton={
        <FocusableCard data-as="button" padding={1} radius={2} tabIndex={0}>
          <Flex align="center" gap={3}>
            <Flex align="center" gap={1} flex={1}>
              <TasksUserAvatar user={mentionedUser} size={1} border={false} />
              <Text size={1} textOverflow="ellipsis" muted={!mentionedUser}>
                {displayText}
              </Text>
            </Flex>

            {value && mentionedUser && !mentionedUser.granted && (
              <Badge fontSize={1}>{t('form.input.assignee.unauthorized.text')}</Badge>
            )}
          </Flex>
        </FocusableCard>
      }
    />
  )
}

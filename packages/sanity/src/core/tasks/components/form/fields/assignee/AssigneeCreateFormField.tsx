import {Badge, Card, TextSkeleton, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {type CSSProperties, useCallback, useMemo} from 'react'
import {Text, Flex} from 'ui5'

import {set} from '../../../../../form/patch/patch'
import {type StringInputProps} from '../../../../../form/types/inputProps'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {useMentionUser} from '../../../../context/mentionUser/useMentionUser'
import {tasksLocaleNamespace} from '../../../../i18n'
import {TasksUserAvatar} from '../../../TasksUserAvatar'
import {focusableCard, inputPlaceholderColorVar} from './AssigneeCreateFormField.css'
import {AssigneeSelectionMenu} from './AssigneeSelectionMenu'

export function AssigneeCreateFormField(props: StringInputProps) {
  const {value, onChange} = props
  const {color} = useThemeV2()
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
        <Card
          className={focusableCard}
          data-as="button"
          padding={1}
          radius={2}
          style={
            {
              [inputPlaceholderColorVar]: color.input.default.enabled.placeholder,
            } as CSSProperties
          }
          tabIndex={0}
        >
          <Flex alignItems="center" gap={3}>
            <Flex alignItems="center" gap={1} flexBasis="0%" flexGrow={1}>
              <TasksUserAvatar user={mentionedUser} size={1} border={false} />
              <Text size={1} truncate={1} muted={!mentionedUser} as="div" trim={true}>
                {displayText}
              </Text>
            </Flex>

            {value && mentionedUser && !mentionedUser.granted && (
              <Badge fontSize={1}>{t('form.input.assignee.unauthorized.text')}</Badge>
            )}
          </Flex>
        </Card>
      }
    />
  )
}

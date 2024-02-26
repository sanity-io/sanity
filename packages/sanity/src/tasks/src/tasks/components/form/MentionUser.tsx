import {type SanityDocument} from '@sanity/client'
import {UserIcon} from '@sanity/icons'
import {Autocomplete, Badge, Card, Flex, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  set,
  type StringInputProps,
  unset,
  useFormValue,
  UserAvatar,
  type UserWithPermission,
} from 'sanity'
import styled from 'styled-components'

import {useMentionUser} from '../../context'
import {type TaskDocument} from '../../types'

type Option = {
  value: string
  label: string
  user: UserWithPermission
}

const FocusableCard = styled(Card)`
  &:focus {
    box-shadow: 0 0 0 1px var(--card-focus-ring-color);
  }
`
export function MentionUserFormField(props: StringInputProps) {
  const {value, onChange, schemaType} = props

  const formValue = useFormValue([]) as TaskDocument
  const targetId = formValue.target?.document?._ref
  const targetType = formValue.target?.documentType
  const {mentionOptions, setSelectedDocument} = useMentionUser()
  const [showMentionOptions, setShowMentionOptions] = useState(false)

  useEffect(() => {
    const documentValue =
      targetId && targetType
        ? // Hack to force the SanityDocument type, we only need to send the _id and _type in this object.
          ({_id: targetId, _type: targetType} as unknown as SanityDocument)
        : null

    setSelectedDocument(documentValue)
  }, [targetId, targetType, setSelectedDocument])

  const mentionedUser = useMemo(
    () => mentionOptions.data?.find((u) => u.id === value),
    [mentionOptions.data, value],
  )

  const handleChange = useCallback((userId: string) => onChange(set(userId)), [onChange])

  const asOptions = mentionOptions.data?.map((user) => ({
    value: user.id,
    label: user.displayName || user.id,
    user: user,
  }))

  const renderOption = useCallback((option: Option) => {
    const {user} = option
    return (
      <Card data-as="button" padding={2} radius={2}>
        <Flex align="center" gap={3}>
          <Flex align="center" gap={2} flex={1}>
            <UserAvatar user={user.id} size={1} />
            <Text size={1} textOverflow="ellipsis">
              {user.displayName}
            </Text>
          </Flex>

          {!user.granted && (
            <Badge fontSize={1} mode="outline">
              Unauthorized
            </Badge>
          )}
        </Flex>
      </Card>
    )
  }, [])

  const filterOption = useCallback(
    (query: string, option: Option) => option.label.toLowerCase().includes(query.toLowerCase()),
    [],
  )
  const handleShowMentionOptions = useCallback(() => setShowMentionOptions(true), [])
  const handleHideMentionOptions = useCallback(() => setShowMentionOptions(false), [])
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') setShowMentionOptions(true)
      if (event.key === 'Backspace') {
        onChange(unset())
        setShowMentionOptions(true)
      }
    },
    [onChange],
  )

  if (value && !showMentionOptions && mentionedUser) {
    return (
      <FocusableCard
        data-as="button"
        padding={1}
        radius={2}
        tabIndex={0}
        onClick={handleShowMentionOptions}
        onKeyDown={handleKeyDown}
      >
        <Flex align="center" gap={3}>
          <Flex align="center" gap={2} flex={1}>
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}}>
              <UserAvatar user={mentionedUser.id} size={1} />
            </motion.div>

            <Text size={1} textOverflow="ellipsis">
              {mentionedUser.displayName}
            </Text>
          </Flex>

          {!mentionedUser.granted && (
            <Badge fontSize={1} mode="outline">
              Unauthorized
            </Badge>
          )}
        </Flex>
      </FocusableCard>
    )
  }

  return (
    <Autocomplete
      id="mentionUser"
      options={asOptions}
      autoFocus={showMentionOptions}
      value={value}
      loading={mentionOptions.loading}
      renderOption={renderOption}
      // eslint-disable-next-line react/jsx-no-bind
      renderValue={(_value, option) => option?.label || _value}
      filterOption={filterOption}
      onChange={handleChange}
      placeholder={schemaType.placeholder}
      fontSize={1}
      onBlur={handleHideMentionOptions}
      icon={UserIcon}
    />
  )
}

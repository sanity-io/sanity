import {AvatarStack, Flex} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {type FormPatch, type PatchEvent, type Path, set, UserAvatar} from 'sanity'

import {Button} from '../../../../../ui-components'
import {type TaskDocument} from '../../types'

interface TasksSubscriberProps {
  value: TaskDocument
  path?: Path
  onChange: (patch: FormPatch | PatchEvent | FormPatch[]) => void
  currentUserId: string
}

export function TasksSubscribers(props: TasksSubscriberProps) {
  const {value, onChange, path, currentUserId} = props

  const userIsSubscribed = value.subscribers?.includes(currentUserId)

  const [buttonText, setButtonText] = useState(userIsSubscribed ? 'Unsubscribe' : 'Subscribe')

  const handleToggleSubscribe = useCallback(() => {
    const subscribers = value.subscribers || []

    if (!subscribers.includes(currentUserId)) {
      onChange(set(subscribers.concat(currentUserId), path))
      setButtonText('Unsubscribe')
    }
    if (subscribers.includes(currentUserId)) {
      onChange(
        set(
          subscribers.filter((subscriberId) => subscriberId !== currentUserId),
          path,
        ),
      )
      setButtonText('Subscribe')
    }
  }, [value.subscribers, currentUserId, onChange, path])

  return (
    <Flex gap={1} align="center">
      <Button mode="bleed" text={buttonText} onClick={handleToggleSubscribe} />
      {value.subscribers && value.subscribers?.length > 0 && (
        <TasksSubscriberAvatars subscriberIds={value.subscribers} />
      )}
    </Flex>
  )
}

export function TasksSubscriberAvatars(props: {subscriberIds?: string[]}) {
  const {subscriberIds} = props

  return (
    <AvatarStack maxLength={3} size={0}>
      {subscriberIds &&
        subscriberIds.map((subscriberId) => <UserAvatar key={subscriberId} user={subscriberId} />)}
    </AvatarStack>
  )
}

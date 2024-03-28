import {type Path} from '@sanity/types'
import {AvatarStack, Flex} from '@sanity/ui'
import {AnimatePresence, motion} from 'framer-motion'
import {useCallback, useMemo} from 'react'

import {Button} from '../../../../ui-components'
import {type FormPatch, type PatchEvent, set} from '../../../form/patch'
import {type TaskDocument} from '../../types'
import {TasksUserAvatar} from '../TasksUserAvatar'

interface TasksSubscriberProps {
  value: TaskDocument
  path?: Path
  onChange: (patch: FormPatch | PatchEvent | FormPatch[]) => void
  currentUserId: string
}

export function TasksSubscribers(props: TasksSubscriberProps) {
  const {value, onChange, path, currentUserId} = props

  const userIsSubscribed = value.subscribers?.includes(currentUserId)

  const buttonText = userIsSubscribed ? 'Unsubscribe' : 'Subscribe'

  const handleToggleSubscribe = useCallback(() => {
    const subscribers = value.subscribers || []

    if (!subscribers.includes(currentUserId)) {
      onChange(set(subscribers.concat(currentUserId), path))
    }
    if (subscribers.includes(currentUserId)) {
      onChange(
        set(
          subscribers.filter((subscriberId) => subscriberId !== currentUserId),
          path,
        ),
      )
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

const EMPTY_ARRAY: [] = []

interface TasksSubscriberAvatarsProps {
  subscriberIds?: string[]
}

export function TasksSubscriberAvatars(props: TasksSubscriberAvatarsProps) {
  const {subscriberIds: subscriberIdsProp} = props

  const subscriberIds = useMemo(() => {
    // Make sure we have valid subscriber IDs
    return subscriberIdsProp?.filter(Boolean) || EMPTY_ARRAY
  }, [subscriberIdsProp])

  return (
    <AnimatePresence initial={false}>
      <AvatarStack maxLength={3} size={0}>
        {subscriberIds.map((subscriberId) => (
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
  )
}

import {
  AvatarStack,
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button as UIButton,
  Flex,
  Text,
} from '@sanity/ui'
import {AnimatePresence, motion} from 'framer-motion'
import {useCallback, useMemo} from 'react'
import {type FormPatch, type PatchEvent, type Path, set} from 'sanity'

import {Button} from '../../../../../ui-components'
import {type TaskDocument} from '../../types'
import {TasksUserAvatar} from '../TasksUserAvatar'
import {TasksSubscribersMenu} from './TasksSubscribersMenu'

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

  const handleUserSubscriptionChange = useCallback(
    (userId: string) => {
      const subscribers = value.subscribers || []

      if (!subscribers.includes(userId)) {
        onChange(set(subscribers.concat(userId), path))
      }
      if (subscribers.includes(userId)) {
        onChange(
          set(
            subscribers.filter((subscriberId) => subscriberId !== userId),
            path,
          ),
        )
      }
    },
    [value.subscribers, onChange, path],
  )

  const handleToggleSubscribe = useCallback(() => {
    handleUserSubscriptionChange(currentUserId)
  }, [handleUserSubscriptionChange, currentUserId])

  return (
    <Flex gap={1} align="center">
      <Button mode="bleed" text={buttonText} onClick={handleToggleSubscribe} />

      <TasksSubscriberAvatars
        subscriberIds={value.subscribers}
        handleUserSubscriptionChange={handleUserSubscriptionChange}
      />
    </Flex>
  )
}

const EMPTY_ARRAY: [] = []

interface TasksSubscriberAvatarsProps {
  subscriberIds?: string[]
  handleUserSubscriptionChange: (userId: string) => void
}

export function TasksSubscriberAvatars(props: TasksSubscriberAvatarsProps) {
  const {subscriberIds: subscriberIdsProp, handleUserSubscriptionChange} = props

  const subscriberIds = useMemo(() => {
    // Make sure we have valid subscriber IDs
    return subscriberIdsProp?.filter(Boolean) || EMPTY_ARRAY
  }, [subscriberIdsProp])

  const onSelect = useCallback(
    (userId: string) => handleUserSubscriptionChange(userId),
    [handleUserSubscriptionChange],
  )

  return (
    <TasksSubscribersMenu
      menuButton={
        <UIButton type="button" mode="bleed" padding={1}>
          {subscriberIds.length > 0 ? (
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
          ) : (
            <Box paddingX={2} paddingY={1}>
              <Text size={1} muted>
                0
              </Text>
            </Box>
          )}
        </UIButton>
      }
      value={subscriberIds}
      onSelect={onSelect}
    />
  )
}

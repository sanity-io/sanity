import {AvatarStack} from '@sanity/ui'
import {UserAvatar} from 'sanity'

export function TasksSubscriberAvatars(props: {subscriberIds?: string[]}) {
  const {subscriberIds} = props

  return (
    <AvatarStack maxLength={3} size={0}>
      {subscriberIds &&
        subscriberIds.map((subscriberId) => <UserAvatar key={subscriberId} user={subscriberId} />)}
    </AvatarStack>
  )
}

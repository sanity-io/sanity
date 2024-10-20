import {useCurrentUser, useUser} from '../store'

export function useGlobalUserId(): string | undefined {
  const currentUser = useCurrentUser()
  // userStore resolves null directly for empty string
  const userId = currentUser?.id ?? ''
  const [user] = useUser(userId)
  return user?.sanityUserId
}

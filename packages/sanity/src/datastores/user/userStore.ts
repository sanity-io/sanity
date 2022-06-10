import {SanityClient} from '@sanity/client'
import {CurrentUser, User} from '@sanity/types'
import DataLoader from 'dataloader'
import raf from 'raf'
import {isRecord} from '../../util'

export interface UserStoreOptions {
  client: SanityClient
  currentUser: CurrentUser | null
}

export interface UserStore {
  getUser(userId: string): Promise<User | null>
  getUsers(userIds: string[]): Promise<User[]>
}

/**
 * Given a `client` and a `currentUser` creates a datastore that handles
 * fetching, batch fetching, and caching users.
 */
export function createUserStore({client: _client, currentUser}: UserStoreOptions): UserStore {
  const client = _client.withConfig({apiVersion: '2021-06-07'})

  const userLoader = new DataLoader<string, User | null>(
    async (userIds) => {
      const value = await client.request<(User | null)[]>({
        uri: `/users/${userIds.join(',')}`,
        withCredentials: true,
        tag: 'users.get',
      })
      const response = Array.isArray(value) ? value : [value]
      const users = response.reduce((acc, next) => {
        if (next?.id) {
          acc[next.id] = next
        }
        return acc
      }, {} as Record<string, User | null>)
      return userIds.map((id) => users[id] || null)
    },
    {batchScheduleFn: (cb) => raf(cb)}
  )

  const userFromCurrentUser: User | null = currentUser && {
    id: currentUser.id,
    displayName: currentUser.name,
    imageUrl: currentUser.profileImage,
  }

  userLoader.prime('me', userFromCurrentUser)

  if (userFromCurrentUser?.id) {
    userLoader.prime(userFromCurrentUser.id, userFromCurrentUser)
  }

  return {
    getUser: (userId) => userLoader.load(userId),
    getUsers: async (userIds) => {
      const results = await userLoader.loadMany(userIds)
      // remove `Error`s from the the results
      return results.filter(
        (result): result is User => isRecord(result) && typeof result.id === 'string'
      )
    },
  }
}

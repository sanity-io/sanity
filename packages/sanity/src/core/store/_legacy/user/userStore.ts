import {SanityClient} from '@sanity/client'
import {CurrentUser, User} from '@sanity/types'
import DataLoader from 'dataloader'
import raf from 'raf'
import {isRecord} from '../../../util'

/** @internal */
export interface UserStoreOptions {
  client: SanityClient
  currentUser: CurrentUser | null
}

const INTERNAL_USER_IDS: User[] = [
  {
    id: '<system>',
    displayName: 'Sanity',
    imageUrl: 'https://public.sanity.io/logos/favicon-192.png',
  },
]

/**
 * @hidden
 * @beta */
export interface UserStore {
  getUser(userId: string): Promise<User | null>
  getUsers(userIds: string[]): Promise<User[]>
}

/**
 * Given a `client` and a `currentUser` creates a datastore that handles
 * fetching, batch fetching, and caching users.
 *
 * @internal
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
      const users = response.reduce(
        (acc, next) => {
          if (next?.id) {
            acc[next.id] = next
          }
          return acc
        },
        {} as Record<string, User | null>,
      )
      return userIds.map((id) => users[id] || null)
    },
    {batchScheduleFn: (cb) => raf(cb)},
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

  INTERNAL_USER_IDS.forEach((user) => userLoader.prime(user.id, user))

  return {
    getUser: async (userId) => {
      try {
        return await userLoader.load(userId)
      } catch (err) {
        /**
         * 403 Forbidden responses indicate that the current user doesn't have read access to project members.
         * In these instances, we don't throw and resolve `null` instead.
         * Components consuming this (such as `<UserAvatar>`) shouldn't render anything in these cases.
         */
        if (err.statusCode === 403) {
          return Promise.resolve(null)
        }
        // Throw all other errors
        throw err
      }
    },
    getUsers: async (userIds) => {
      const results = await userLoader.loadMany(userIds)
      /**
       * Unlike `load()`, DataLoader's `loadMany()` will always resolve even if it contains `Error` instances.
       * Here, we remove all Errors (or more specifically, only include records with valid IDs).
       */
      return results.filter(
        (result): result is User => isRecord(result) && typeof result.id === 'string',
      )
    },
  }
}

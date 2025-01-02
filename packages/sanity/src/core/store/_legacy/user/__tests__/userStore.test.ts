import {type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {describe, expect, it, vi} from 'vitest'

import {createUserStore} from '../userStore'

export class HttpError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HttpError'
  }

  statusCode?: number
}

// Mock client which always throws 403 Forbidden errors on `request`
const failingClient = {
  request: vi.fn(() => {
    const error = new HttpError('Forbidden')
    error.statusCode = 403
    throw error
  }),
  withConfig: () => failingClient,
} as unknown as SanityClient

// Mock client which always throws 403 Forbidden errors on `request`
const getClient = () => {
  const client = {
    request: vi.fn((options: {uri: string}) => {
      const userIds = options.uri.slice(options.uri.lastIndexOf('/') + 1).split(',')
      return Promise.resolve(
        userIds
          // Skip IDs that do not start with a `p`, to allow us to test the case where some users are not returned
          .filter((id) => id.startsWith('p'))
          .map((id) => ({id, displayName: `User ${id}`})),
      )
    }),
    withConfig: () => client,
  } as unknown as SanityClient
  return client
}

const failingUserStore = createUserStore({client: failingClient, currentUser: null})
const getUserStore = ({
  currentUser,
  client,
}: {currentUser?: CurrentUser | null; client?: SanityClient} = {}) =>
  createUserStore({client: client || getClient(), currentUser: currentUser || null})

describe('userStore', () => {
  describe('getUser()', () => {
    it(`resolves with null on 403 responses`, async () => {
      await expect(failingUserStore.getUser('foo')).resolves.toEqual(null)
    })
  })
  describe('getUsers()', () => {
    it(`resolves with an empty array on 403 responses`, async () => {
      await expect(failingUserStore.getUsers(['foo', 'bar'])).resolves.toStrictEqual([])
    })

    it('fetches correctly when passing single user', async () => {
      await expect(getUserStore().getUsers(['p3t3rh0fs'])).resolves.toEqual([
        {id: 'p3t3rh0fs', displayName: 'User p3t3rh0fs'},
      ])
    })

    it('fetches correctly when passing multiple users', async () => {
      await expect(getUserStore().getUsers(['p3sp3nh0v', 'pr1v47e00'])).resolves.toEqual([
        {id: 'p3sp3nh0v', displayName: 'User p3sp3nh0v'},
        {id: 'pr1v47e00', displayName: 'User pr1v47e00'},
      ])
    })

    it('skips (not throws) when passing users that do not exist', async () => {
      await expect(getUserStore().getUsers(['p3sp3nh0v', 'f00b4r', 'pr1v47e00'])).resolves.toEqual([
        {id: 'p3sp3nh0v', displayName: 'User p3sp3nh0v'},
        {id: 'pr1v47e00', displayName: 'User pr1v47e00'},
      ])
    })

    it('does not refetch current user if passed when constructing user store, normalizes', async () => {
      const currentUser: CurrentUser = {
        id: 'pl0l3sp3n',
        name: 'Espen',
        email: 'e5p3n@sanity.io',
        role: 'admin',
        roles: [{name: 'admin', title: 'Administrator'}],
      }
      await expect(getUserStore({currentUser}).getUsers([currentUser.id])).resolves.toEqual([
        {
          id: currentUser.id,
          displayName: currentUser.name,
        },
      ])
    })

    it('does not refetch users that already have been fetched', async () => {
      const client = getClient()
      const userStore = getUserStore({client})

      await expect(userStore.getUsers(['pAbC', 'pDeF'])).resolves.toHaveLength(2)
      expect(client.request).toHaveBeenCalledTimes(1) // Should fetch those users one time

      await expect(userStore.getUsers(['pDeF', 'pAbC'])).resolves.toHaveLength(2)
      expect(client.request).toHaveBeenCalledTimes(1) // Should not refetch those users
    })

    it('fetches correctly when passing a huge amount of users - splits batches', async () => {
      const client = getClient()
      const userIds = Array.from({length: 1500}, (_, i) => `p50m3u53r${i}`)
      const lastBatch = userIds.slice(-300)
      await expect(getUserStore({client}).getUsers(userIds)).resolves.toHaveLength(userIds.length)
      expect(client.request).toHaveBeenCalledTimes(4) // Math.ceil(1500 / 400) = 4, eg 4 batches
      expect(client.request).toHaveBeenLastCalledWith({
        uri: `/users/${lastBatch.join(',')}`,
        tag: 'users.get',
        withCredentials: true,
      })
    })
  })
})

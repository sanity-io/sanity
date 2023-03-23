import {SanityClient} from '@sanity/client'
import {createUserStore} from '../userStore'

export class HttpError extends Error {
  statusCode?: number
}

// Mock client which always throws 403 Forbidden errors on `request`
const client = {
  request: jest.fn(() => {
    const error = new HttpError('Forbidden')
    error.statusCode = 403
    throw error
  }),
  withConfig: () => client,
} as unknown as SanityClient

const userStore = createUserStore({client, currentUser: null})

describe('userStore', () => {
  describe('getUser()', () => {
    it(`resolves with null on 403 responses`, async () => {
      await expect(userStore.getUser('foo')).resolves.toEqual(null)
    })
  })
  describe('getUsers()', () => {
    it(`resolves with an empty array on 403 responses`, async () => {
      await expect(userStore.getUsers(['foo', 'bar'])).resolves.toStrictEqual([])
    })
  })
})

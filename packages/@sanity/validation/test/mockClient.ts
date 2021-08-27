import type {SanityClient} from '@sanity/client'

/**
 * this mock client is used via the `moduleNameMapper` in `jest.config.js`
 *
 * you can import the part and use the mock from each method like so:
 *
 * ```ts
 * import client from 'part:@sanity/base/client'
 *
 * afterEach(() => {
 *   ;(client.fetch as jest.Mock).mockReset();
 * })
 *
 * describe('someFeatureThatUsesTheClient', () => {
 *
 *   test('some test', async () => {
 *     // set up the mock
 *     ;(client.fetch as jest.Mock).mockImplementation(() => Promise.resolve('example'))
 *
 *     // do you test
 *     // e.g. validateDocument()
 *
 *     expect(client.fetch).toHaveBeenCalledTime(1)
 *     expect((client.mock as jest.Mock).mock.calls).toMatchObject({
 *       // ...
 *     })
 *   })
 * })
 * ```
 */
const client = ({
  fetch: jest.fn(),
  withConfig: jest.fn(() => client),
} as unknown) as SanityClient

module.exports = client

import {expect, test} from '@jest/globals'

import {assert2xx} from '../fetchStream'

test('server responds with 2xx', async () => {
  const mockResponse = {
    status: 200,
    statusText: 'OK',
    json: () =>
      Promise.resolve({
        this: 'is fine',
      }),
  }
  await expect(assert2xx(mockResponse as unknown as Response)).resolves.toBeUndefined()
})

test('server responds with 4xx and error response', () => {
  const mockResponse = {
    status: 400,
    statusText: 'Request error',
    json: () =>
      Promise.resolve({
        error: 'Error message',
        status: 400,
        message: 'More details',
      }),
  }
  expect(assert2xx(mockResponse as unknown as Response)).rejects.toThrowError({
    statusCode: 400,
    message: 'Error message: More details',
  })
})

test('server responds with 5xx and no json response', () => {
  const mockResponse = {
    status: 500,
    statusText: 'Internal Server Error',
    json: () => Promise.reject(new Error('Failed to parse JSON')),
  }
  expect(assert2xx(mockResponse as unknown as Response)).rejects.toThrowError({
    statusCode: 500,
    message: 'HTTP Error 500: Internal Server Error',
  })
})

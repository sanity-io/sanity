import {afterAll, beforeAll, describe, expect, jest, test} from '@jest/globals'

import {shortRelativeDate} from '../shortRelativeDate'

describe('shortRelativeDate', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2024, 6, 28, 12, 0))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  test('returns just now for times less than a minute ago', () => {
    const result = shortRelativeDate(new Date(Date.now() - 30 * 1000)) // 30 seconds ago
    expect(result).toEqual('just now')
  })

  test('returns the correct format for minutes ago', () => {
    const result = shortRelativeDate(new Date(Date.now() - 5 * 60 * 1000)) // 5 minutes ago
    expect(result).toEqual('5m ago')
  })

  test('returns the correct format for hours ago', () => {
    const result = shortRelativeDate(new Date(Date.now() - 3 * 60 * 60 * 1000)) // 3 hours ago
    expect(result).toEqual('3h ago')
  })

  test('returns the correct format for days ago', () => {
    const result = shortRelativeDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) // 2 days ago
    expect(result).toEqual('2d ago')
  })

  test('returns the correct format for months ago', () => {
    const result = shortRelativeDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // approx 1 month ago
    expect(result).toEqual('1mo ago')
  })

  test('returns the correct format for years ago', () => {
    const result = shortRelativeDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) // approx 1 year ago
    expect(result).toEqual('1y ago')
  })

  test('returns just now for times less than a minute in the future', () => {
    const result = shortRelativeDate(new Date(Date.now() + 30 * 1000)) // in 30 seconds
    expect(result).toEqual('just now')
  })

  test('returns the correct format for minutes ago', () => {
    const result = shortRelativeDate(new Date(Date.now() + 5 * 60 * 1000)) // in 5 minutes
    expect(result).toEqual('5m from now')
  })

  test('returns the correct format for hours ago', () => {
    const result = shortRelativeDate(new Date(Date.now() + 3 * 60 * 60 * 1000)) // in 3 hours
    expect(result).toEqual('3h from now')
  })

  test('returns the correct format for days ago', () => {
    const result = shortRelativeDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)) // in 2 days
    expect(result).toEqual('2d from now')
  })

  test('returns the correct format for months ago', () => {
    const result = shortRelativeDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // approx in 1 month
    expect(result).toEqual('1mo from now')
  })

  test('returns the correct format for years ago', () => {
    const result = shortRelativeDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) // approx in 1 year
    expect(result).toEqual('1y from now')
  })

  test('handles string input for dates', () => {
    const dateString = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    const result = shortRelativeDate(dateString)
    expect(result).toEqual('1y ago')
  })

  test('handles number input for timestamps', () => {
    const timestamp = Date.now() - 5 * 60 * 1000 // 5 minutes ago
    const result = shortRelativeDate(timestamp)
    expect(result).toEqual('5m ago')
  })

  test('handles Date object input', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    const result = shortRelativeDate(date)
    expect(result).toEqual('5m ago')
  })
})

import {afterEach, describe, expect, it} from 'vitest'

import {removeAuthHashParams, takeHashParam} from '../authHashParams'

describe('takeHashParam', () => {
  afterEach(() => {
    window.history.replaceState(null, '', window.location.pathname)
  })

  it('matches the param by its exact name', () => {
    window.history.replaceState(null, '', '#access_token=abc&keep=me')

    expect(takeHashParam('token')).toBeUndefined()
    expect(window.location.hash).toBe('#access_token=abc&keep=me')
  })

  it('removes every occurrence of the param', () => {
    window.history.replaceState(null, '', '#token=first&keep=me&token=second')

    expect(takeHashParam('token')).toBe('first')
    expect(window.location.hash).toBe('#keep=me')
  })

  it('keeps the current history state', () => {
    window.history.replaceState({key: 'entry'}, '', '#token=abc')

    takeHashParam('token')

    expect(window.history.state).toEqual({key: 'entry'})
  })
})

describe('removeAuthHashParams', () => {
  it('returns a hash without auth params unchanged', () => {
    expect(removeAuthHashParams('#a&&b')).toBe('#a&&b')
  })

  it('returns an empty hash unchanged', () => {
    expect(removeAuthHashParams('#')).toBe('#')
  })

  it('removes auth params and keeps the others', () => {
    expect(removeAuthHashParams('#sid=x&a=1')).toBe('#a=1')
  })
})

import {describe, expect, it} from 'vitest'

import {
  applyUserAttributesToFilter,
  grantFilterUsesUserAttributes,
  grantsPermissionOn,
  userAttributesToObject,
} from '../grantsStore'
import {type Grant} from '../types'

const bookDoc = {_id: 'book-1', _type: 'book', branch: 'london'}

describe('grantFilterUsesUserAttributes', () => {
  it('detects user::attributes() in grant filters', () => {
    expect(
      grantFilterUsesUserAttributes('_type == "book" && branch == user::attributes().branch'),
    ).toBe(true)
    expect(grantFilterUsesUserAttributes('_id in path("**")')).toBe(false)
  })
})

describe('applyUserAttributesToFilter', () => {
  it('rewrites user::attributes() to a GROQ object literal', () => {
    expect(
      applyUserAttributesToFilter('branch == user::attributes().branch', {branch: 'london'}),
    ).toBe('branch == {"branch":"london"}.branch')
  })
})

describe('userAttributesToObject', () => {
  it('maps CurrentUser attributes to a plain object', () => {
    expect(
      userAttributesToObject([
        {key: 'branch', type: 'string', value: 'london'},
        {key: 'locales', type: 'string-array', value: ['en', 'es']},
      ]),
    ).toEqual({branch: 'london', locales: ['en', 'es']})
  })

  it('returns an empty object when attributes are missing', () => {
    expect(userAttributesToObject(undefined)).toEqual({})
    expect(userAttributesToObject([])).toEqual({})
  })
})

describe('grantsPermissionOn', () => {
  it('does not throw when a grant filter uses user::attributes() without attribute values', async () => {
    const grants: Grant[] = [
      {
        filter: '_type == "book" && branch == user::attributes().branch',
        permissions: ['read'],
      },
    ]

    await expect(grantsPermissionOn('user-1', grants, 'read', bookDoc)).resolves.toEqual({
      granted: false,
      reason: 'No matching grants found',
    })
  })

  it('still grants access from evaluable grants when another grant uses user::attributes()', async () => {
    const grants: Grant[] = [
      {
        filter: '_id in path("**")',
        permissions: ['read', 'update'],
      },
      {
        filter: '_type == "book" && branch == user::attributes().branch',
        permissions: ['read'],
      },
    ]

    await expect(grantsPermissionOn('admin-1', grants, 'read', bookDoc)).resolves.toEqual({
      granted: true,
      reason: 'Matching grant',
    })
  })

  it('evaluates user::attributes() filters when attribute values are provided', async () => {
    const grants: Grant[] = [
      {
        filter: '_type == "book" && branch == user::attributes().branch',
        permissions: ['read'],
      },
    ]

    await expect(
      grantsPermissionOn('user-1', grants, 'read', bookDoc, {branch: 'london'}),
    ).resolves.toEqual({
      granted: true,
      reason: 'Matching grant',
    })

    await expect(
      grantsPermissionOn('user-1', grants, 'read', bookDoc, {branch: 'oslo'}),
    ).resolves.toEqual({
      granted: false,
      reason: 'No matching grants found',
    })
  })
})

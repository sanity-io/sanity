import type {ConditionalPropertyCallbackContext, CurrentUser} from '@sanity/types'
import {userHasRole} from './userHasRole'

const roleLessUser: CurrentUser = {
  id: 'pabc123',
  email: 'some@user.com',
  name: 'Some User',
  role: '',
  roles: [],
}

const conditionalContextUser: ConditionalPropertyCallbackContext['currentUser'] = {
  id: 'pabc123',
  email: 'some@user.com',
  name: 'Some User',
  roles: [{name: 'administrator', title: 'Administrator'}],
}

const adminUser: CurrentUser = {
  ...roleLessUser,
  role: 'administrator', // Legacy
  roles: [{name: 'administrator', title: 'Administrator'}],
}

const multiRoleUser: CurrentUser = {
  ...adminUser,
  role: 'editor', // Legacy
  roles: [
    {name: 'translator', title: 'Translator'},
    {name: 'editor', title: 'Editor'},
  ],
}

test('userHasRole(): no roles', () => {
  expect(userHasRole(roleLessUser, 'administrator')).toBe(false)
})

test('userHasRole(): no match', () => {
  expect(userHasRole(adminUser, 'dogwalker')).toBe(false)
})

test('userHasRole(): match (single role)', () => {
  expect(userHasRole(adminUser, 'administrator')).toBe(true)
})

test('userHasRole(): match (multiple roles)', () => {
  expect(userHasRole(multiRoleUser, 'editor')).toBe(true)
})

test('userHasRole(): no match (multiple roles)', () => {
  expect(userHasRole(multiRoleUser, 'administrator')).toBe(false)
})

test('userHasRole(): conditional property callback context (no `role` prop)', () => {
  expect(userHasRole(conditionalContextUser, 'administrator')).toBe(true)
  expect(userHasRole(conditionalContextUser, 'dogwalker')).toBe(false)
})

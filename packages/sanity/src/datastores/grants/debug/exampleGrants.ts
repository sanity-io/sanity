// NOTE: these example grants are used in other test files.
// if you change this file, check to see if other files need to be updated too
import {Grant} from '../types'

export const administrator: Grant[] = [
  {
    filter: '_id in path("**")',
    permissions: ['read', 'create', 'history', 'update'],
  },
]

export const editor: Grant[] = [
  {
    filter: '_id in path("**")',
    permissions: ['read', 'create', 'history', 'update'],
  },
]

export const developer: Grant[] = [
  {
    filter: '_id in path("**")',
    permissions: ['read', 'create', 'history', 'update'],
  },
]

export const contributor: Grant[] = [
  {
    filter: '_id in path("**")',
    permissions: ['read'],
  },
  {
    filter: '_id in path("drafts.**")',
    permissions: ['create', 'history', 'update'],
  },
]

export const viewer: Grant[] = [
  {
    filter: '_id in path("**")',
    permissions: ['read', 'history'],
  },
]

export const requiresApproval: Grant[] = [
  {
    filter: '!locked',
    permissions: ['read', 'create', 'update'],
  },
]

export const restricted: Grant[] = [
  {
    filter:
      '_id in path("drafts.**") && _type in ["stringsTest", "book", "author", "referenceTest"]',
    permissions: ['read', 'create', 'history', 'update'],
  },
  {
    filter: '_id in path("**")',
    permissions: ['read'],
  },
]

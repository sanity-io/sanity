import getDefaultModule from './getDefaultModule'

// We are lazy-loading the part to work around typescript trying to resolve it
export const getPlusIcon = (): Function =>
  getDefaultModule(require('part:@sanity/base/compose-icon'))
export const getSortIcon = (): Function => getDefaultModule(require('part:@sanity/base/sort-icon'))
export const getListIcon = (): Function =>
  getDefaultModule(require('part:@sanity/base/stack-compact-icon'))
export const getDetailsIcon = (): Function =>
  getDefaultModule(require('part:@sanity/base/stack-icon'))

// We are lazy-loading the part to work around typescript trying to resolve it
export const getPlusIcon = (): Function => require('part:@sanity/base/plus-icon')
export const getSortIcon = (): Function => require('part:@sanity/base/sort-icon')
export const getListIcon = (): Function => require('part:@sanity/base/bars-icon')

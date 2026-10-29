import {defineLocaleResourceBundle} from 'sanity'

import {getComponent} from '../design-options/config'
import {getOptionState, resolveOption, useOption} from '../design-options/store'

/** The base document's name in each place: the pill that is always on screen, menus, the version inventory, and "Back to …". */
export interface BaseNames {
  pill: string
  menu: string
  inventory: string
  back: string
}

const SERVED = 'Default · served when no variant matches'

const NAMES: Record<string, BaseNames> = {
  // A, as today: the document pill's clear link says "Back to All users (Default)", the banner "Back to All users". One `back` keeps the first.
  a: {
    pill: 'All users',
    menu: 'All users (Default)',
    inventory: 'Base · all visitors',
    back: 'All users (Default)',
  },
  b: {pill: 'Base', menu: 'Base', inventory: 'Base', back: 'Base'},
  c: {pill: 'Default', menu: 'Default', inventory: 'Default', back: 'Default'},
  d: {pill: 'Default', menu: SERVED, inventory: SERVED, back: 'Default'},
}

function namesFor(option: string): BaseNames {
  return NAMES[option] ?? NAMES.a
}

/** The names now, outside React (model code). Components use `useBaseNames`, which re-renders when C15 changes. */
export function baseNames(): BaseNames {
  const component = getComponent('c15')
  return namesFor(component ? resolveOption(component, getOptionState()) : 'a')
}

export function useBaseNames(): BaseNames {
  return namesFor(useOption('c15'))
}

// Core's two strings for the base document, read once when the namespace loads (so a C15 change needs a reload). Option A keeps core's text.
function coreOverride(key: string) {
  return async () => {
    const names = baseNames()
    return names === NAMES.a ? {} : {[key]: names.menu}
  }
}

export const baseNameBundles = [
  defineLocaleResourceBundle({
    locale: 'en-US',
    namespace: 'studio',
    resources: coreOverride('document-group.base-variant'),
  }),
  defineLocaleResourceBundle({
    locale: 'en-US',
    namespace: 'variants',
    resources: coreOverride('navbar.variant.default'),
  }),
]
